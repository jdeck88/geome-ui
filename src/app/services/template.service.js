import angular from 'angular';
import fileService from './file.service';

import config from '../utils/config';
const { restRoot } = config;

class TemplateService {
  constructor($http, FileService) {
    'ngInject';

    this.$http = $http;
    this.FileService = FileService;
  }

  all(projectId) {
    return this.$http.get(`${restRoot}projects/${projectId}/templates`);
  }

  generate(projectId, sheetName, columns) {
    return this.$http
      .post(`${restRoot}projects/${projectId}/templates/generate`, {
        sheetName,
        columns,
      })
      .then(response => this.FileService.download(response.data.url))
      .catch(angular.catcher('Failed to generate template'));
  }
}

export default angular
  .module('fims.templateService', [fileService])
  .service('TemplateService', TemplateService).name;
