import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const responseHandler = (response: AxiosResponse) => {
  return response.data;
};

const errorHandler = (error: AxiosError) => {
  if (error.response) {
    throw error.response;
  } else if (error.request) {
    throw error.request;
  }
  throw error.message;
};

class HttpClient {
  request(config: AxiosRequestConfig): Promise<any> {
    return Axios.request(config).then(responseHandler).catch(errorHandler);
  }

  get(url: string, config: AxiosRequestConfig = {}): Promise<any> {
    return Axios.get(url, config).then(responseHandler).catch(errorHandler);
  }

  post(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<any> {
    return Axios.post(url, data, config).then(responseHandler).catch(errorHandler);
  }

  put(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<any> {
    return Axios.put(url, data, config).then(responseHandler).catch(errorHandler);
  }

  delete(url: string, data = {}, config: AxiosRequestConfig = {}): Promise<any> {
    return Axios.delete(url, { data, ...config })
      .then(responseHandler)
      .catch(errorHandler);
  }
}

export default new HttpClient() as HttpClient;
