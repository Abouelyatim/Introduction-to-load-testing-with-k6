// k6 run --log-format json --log-output=file=./k6-detokenize-errors.log -e ENVIRONMENT=prod -e AUTHORIZATION_BEARER_TOKEN= detokenize_credit_card_number_k6_load_test.js
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  scenarios: {
    tokenize_credit_card_number_load_test: {
      executor: 'ramping-arrival-rate',
      stages: [
        { target: 50, duration: "30m" },    
        { target: 100, duration: "3m" }, 
        { target: 100, duration: "30m" }, 
        { target: 150, duration: "3m" }, 
        { target: 150, duration: "30m" }, 
        { target: 200, duration: "3m" },   
        { target: 200, duration: "30m" }, 
        { target: 250, duration: "3m" }, 
      ],
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 700,
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<=0.02', abortOnFail: true, }],
    http_req_duration: [{ threshold: 'p(95)<=2000' }],
    checks: [{ threshold: 'rate>=0.98', abortOnFail: true, }],
  },
};

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

const protegrityTokens = new SharedArray('all tokens', function () { //read-only array like structure that shares memory between VUs
  return JSON.parse(open('./data/credit_card_tokenization_protegrity_token.json')).credit_card_tokenization;
});

const reqQuery = `{"query": "query detokenizeProtegrityToken($input: String!) {detokenizeProtegrityToken(input: $input) }","variables": {"input": "${protegrityTokens[Math.floor(Math.random() * protegrityTokens.length)]}"}}`

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
	
	if(!res.hasOwnProperty('detokenizeProtegrityToken')) {
		console.log(`transaction_id: ${headers['Transaction-Id']}`)
	}


    let passed = check(res, {
        'is status 200': (r) => r.status === 200,
        'body contains detokenizeProtegrityToken': (r) => r.json().data.detokenizeProtegrityToken.length > 0,
    });
	
}