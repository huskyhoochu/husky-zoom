import axios, { AxiosInstance } from 'axios';

class F {
  public axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }
}

const Fetcher = new F(axios.create());

export default Fetcher;
