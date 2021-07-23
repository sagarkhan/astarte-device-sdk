/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
