import http from 'k6/http';
import { check } from 'k6';

// Rate
// 20/s |                            ...
//      |                         ../   \...    
//  10  |                ......../          \
//      |             ../      
//  5   |  ........../      
//      |
//  0/s +---------------------------------------+ 30s
//                      

export const options = {//it is good if we have stats for each stage
  scenarios: {
    tokenize_credit_card_number_load_test: {
      executor: 'ramping-arrival-rate',
      stages: [
        { target: 5, duration: "10s" },//target == iterration 
        { target: 10, duration: "2s" },
        { target: 10, duration: "8s" },
        { target: 20, duration: "2s" },
        { target: 20, duration: "3s" },
        { target: 10, duration: "3s" },
      ],
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
    },
    
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<=0.02', abortOnFail: true, }],
    http_req_duration: [{ threshold: 'p(95)<=2000' }],
    checks: [{ threshold: 'rate>=0.98', abortOnFail: true, }],
  },
};

function generateValidCard() {

  /**
   * Luhn algorithm in JavaScript: validate credit card number supplied as string of numbers
   * @author ShirtlessKirk. Copyright (c) 2012.
   * @license WTFPL (http://www.wtfpl.net/txt/copying)
   */
  var luhnChk = (function (arr) {
      return function (ccNum) {
          var 
              len = ccNum.length,
              bit = 1,
              sum = 0,
              val;

          while (len) {
              val = parseInt(ccNum.charAt(--len), 10);
              sum += (bit ^= 1) ? arr[val] : val;
          }

          return sum && sum % 10 === 0;
      };
  }([0, 2, 4, 6, 8, 1, 3, 5, 7, 9]));

var cardNumber = generate(16),
  luhnValid  = luhnChk(cardNumber),
  limit      = 20,
  counter	   = 0;

while (!luhnValid) {
  cardNumber = generate(16);
  luhnValid  = luhnChk(cardNumber);
  counter++;
  
  if (counter === limit) {
    cardNumber = (luhnValid) ? cardNumber : 'cannot make valid card with given params'
    break;
  }
}

return cardNumber;
}

function generate(length) {
  var cardNumber = "",
      randomNumberLength = length - ("".length + 1);

  for (var i = 0; i < randomNumberLength; i++) {
      var digit = Math.floor((Math.random() * 9) + 0);
      cardNumber += digit;
  }

var checkDigit = getCheckDigit(cardNumber);

cardNumber += String(checkDigit);

  return cardNumber;
}

function getCheckDigit(number) {
  var sum = 0,
      module,
      checkDigit;

  for (var i = 0; i < number.length; i++) {

      var digit = parseInt(number.substring(i, (i + 1)));

      if ((i % 2) == 0) {
          digit = digit * 2;
          if (digit > 9) {
              digit = (digit / 10) + (digit % 10);
          }
      }
      sum += digit;
  }

  module     = parseInt(sum) % 10;
  checkDigit = ((module === 0) ? 0 : 10 - module);
  
  return checkDigit;
}

function generateUniqSerial() {
  return 'xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.AUTHORIZATION_BEARER_TOKEN}`,
  'Transaction-Id' : `${generateUniqSerial()}`
}

const reqQuery = `{"query": "mutation tokenizeCreditCardNumber($input: String!) {tokenizeCreditCardNumber(input: $input) }","variables": {"input": "${generateValidCard()}"}}`

function getUrlByEnvironment(config) {
  switch (config.env) {
    case 'lab':
      return config.labUrl;
    case 'prod':
      return config.prodUrl;
    default:
      throw new Error('Invalid environment provided');
  }
}

const config = {
  env: `${__ENV.ENVIRONMENT}`,
  labUrl: 'https://www.egencia-test.com',
  prodUrl: 'https://www.egencia.com'
};

export default function () {
  const url = getUrlByEnvironment(config)
  const res = http.post(url+'/payment-means-service/graphql', reqQuery, { headers: headers });

if(!res.hasOwnProperty('tokenizeCreditCardNumber')) {
  console.log(`transaction_id: ${headers['Transaction-Id']}`)
}


  let passed = check(res, {
      'is status 200': (r) => r.status === 200,
      'body contains tokenizeCreditCardNumber': (r) => r.json().data.tokenizeCreditCardNumber.length > 0,
  });

}