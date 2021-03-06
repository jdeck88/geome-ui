import angular from 'angular';

const template = require('./login.html');

class LoginController {
  constructor($state, UserService, AuthService, LoadingModal) {
    'ngInject';

    this.state = $state;
    this.UserService = UserService;
    this.AuthService = AuthService;
    this.loadingModal = LoadingModal;
  }

  $onInit() {
    this.resetPass = false;
    this.credentials = {
      username: '',
      password: '',
    };
  }

  resetPassword() {
    this.UserService.sendResetPasswordToken(this.credentials.username)
      .then(() =>
        angular.alerts.success(
          'Successfully sent reset password token. Check your email for further instructions.',
        ),
      )
      .catch(angular.catcher('Error sending reset password token'));
  }

  submit() {
    angular.alerts.removeTmp();
    this.loadingModal.open();
    this.AuthService.authenticate(
      this.credentials.username,
      this.credentials.password,
    )
      .then(() => this.UserService.get(this.credentials.username))
      .then(user => {
        this.UserService.setCurrentUser(user);
        const { params } = this.state;
        if (params.nextState && params.nextState !== 'login') {
          this.state.go(params.nextState, params.nextStateParams, {
            reload: true,
            inherit: false,
          });
          return;
        }
        this.state.go('about', {}, { reload: true, inherit: false });
      })
      .catch(angular.catcher('Error during authentication.'))
      .finally(() => this.loadingModal.close());
  }
}

export default {
  template,
  controller: LoginController,
};
