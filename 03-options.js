import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 5,
    iterations: 10,
    duration: '10s'
  };

export default function() {
  let url = 'https://httpbin.test.k6.io/post';
  let response = http.post(url, 'Hello world!');
  check(response, {
      'Application says hello': (r) => r.body.includes('Hello world!')
  });

  sleep(1);
}