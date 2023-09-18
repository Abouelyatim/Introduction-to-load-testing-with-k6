import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://httpbin.test.k6.io'

export let options = {
    vus: 5,
    iterations: 10,
    duration: '10s'
  };

  export function setup() {
    // This is setup code. It runs once at the beginning of the test, regardless of the number of VUs.
    let res = http.get(BASE_URL)
    if (res.status !== 200) {
      throw new Error(`Got unexpected status code ${res.status} when trying to setup. Exiting.`)
    }
  }

export default function() {
  let url = `${BASE_URL}/post`;
  let response = http.post(url, 'Hello world!');
  check(response, {
      'Application says hello': (r) => r.body.includes('Hello world!')
  });

  sleep(1);
}

export function teardown(){
  // This is teardown code. It runs once at the end of the test, regardless of the number of VUs.
    // TODO: Send notification to Slack
    console.log("That's all folks!")
  }