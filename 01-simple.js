import http from 'k6/http';
import { check } from 'k6';

export default function() {
  let url = 'https://httpbin.test.k6.io/post';
  let response = http.post(url, 'Hello world!');

  console.log(response.json().data);

  check(response, {
    'is status 200': (r) => r.status === 200,
    'Application says hello': (r) => r.body.includes('Hello world!')
});
}