function getStates() {
  return [
    {
      state: 'project.expeditions',
      config: {
        url: '/expeditions',
        resolve: {
          expeditions: /* @ngInject */ (
            $state,
            ProjectService,
            ExpeditionService,
          ) =>
            ExpeditionService.all(ProjectService.currentProject().projectId)
              .then(response => response.data)
              .catch(() => $state.go('project')),
        },
        views: {
          details: {
            component: 'fimsProjectExpeditions',
          },
        },
      },
    },
    {
      state: 'project.expeditions.detail',
      config: {
        url: '/:id',
        redirectTo: 'project.expeditions.detail.settings',
        resolve: {
          expedition: /* @ngInject */ ($transition$, $state, expeditions) => {
            let expedition = $transition$.params().expedition;
            if (expedition) {
              return expedition;
            }

            const id = $transition$.params().id;
            expedition = expeditions.find(e => e.expeditionId === id);

            if (expedition) {
              return expedition;
            }

            return $state.go('project.expeditions');
          },
          backState: () => 'project.expeditions',
        },
        views: {
          '@': {
            component: 'fimsProjectExpedition',
          },
        },
        params: {
          id: {
            type: 'int',
          },
          expedition: {},
        },
      },
    },
    {
      state: 'project.expeditions.detail.settings',
      config: {
        url: '/settings',
        views: {
          details: {
            component: 'fimsExpeditionSettings',
          },
        },
      },
    },
    {
      state: 'project.expeditions.detail.resources',
      config: {
        url: '/resources',
        views: {
          details: {
            component: 'fimsExpeditionResources',
          },
        },
      },
    },
    {
      state: 'project.expeditions.detail.members',
      config: {
        url: '/members',
        views: {
          details: {
            template: require('../../../components/expeditions/expedition-members.html'),
            // controller: "ExpeditionMembersController as vm"
          },
        },
      },
    },
  ];
}

export default routerHelper => {
  'ngInject';

  routerHelper.configureStates(getStates());
};
