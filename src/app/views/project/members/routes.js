function getStates() {
  return [
    {
      state: 'project.members',
      config: {
        url: '/members',
        resolve: {
          members: /*ngInject*/ ($state, ProjectMembersService, currentProject) =>
            ProjectMembersService.all(currentProject.projectId)
              .then(({ data }) => data)
              .catch(() => $state.go('project')),
          currentUser: /*ngInject*/ (UserService) => UserService.currentUser,
        },
        views: {
          "details": {
            component: 'fimsProjectMembers',
          },
        },
      },
    },
    {
      state: 'project.members.add',
      config: {
        url: '/add',
        component: 'fimsProjectMembersAdd',
        resolve: {
          users: /*ngInject*/ (UserService, members) => UserService.all()
            .filter(u => members.find(m => u.username === m.username) === undefined)
            .map(u => ({
              // only keep keys we are interested in. This allows us to use $ in the ui-select $filter to filter
              // users using the search term on all properties
              username: u.username,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              institution: u.institution,
            })),
        },
      },
    },
  ]
}

export default (routerHelper) => {
  'ngInject';
  routerHelper.configureStates(getStates());
};