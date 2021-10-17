import { AxiosError } from 'axios';

export default function parseErrMsg(e: AxiosError): string {
  // https://yamoo9.github.io/axios/guide/error-handling.html
  if (e.response) {
    // 요청이 이루어졌으며 서버가 2xx의 범위를 벗어나는 상태 코드로 응답했습니다.
    if (e.response.status > 399) {
      const { message } = e.response.data as { message: string };
      return message;
    }

    return e.message;
  } else if (e.request) {
    // 요청이 이루어 졌으나 응답을 받지 못했습니다.
    // `e.request`는 브라우저의 XMLHttpRequest 인스턴스 또는
    // Node.js의 http.ClientRequest 인스턴스입니다.
    return 'Network Error';
  } else {
    // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
    return e.message;
  }
}
