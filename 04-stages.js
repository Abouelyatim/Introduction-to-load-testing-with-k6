import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
      { duration: '5s', target: 8 },//target == vu
      { duration: '3s', target: 4 },
      { duration: '2s', target: 0 },
    ],
  };

export default function() {
  let url = 'https://httpbin.test.k6.io/post';
  let response = http.post(url, 'Hello world!');
  check(response, {
      'Application says hello': (r) => r.body.includes('Hello world!')
  });

  sleep(1);
}