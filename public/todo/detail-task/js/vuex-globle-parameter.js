// Parameter are declared by Vuex.
// Can use it into each component or function like globle parameter
// Setting up VueX store
//https://vuex.vuejs.org/guide/actions.html
const vStore = new Vuex.Store({
    state: {
        userActor: {},
        userViewed: {},
        organization: {}
    },
    mutations: {
        userActorMutation: function (state, userObject) {
            state.userActor = cloneObject(userObject)
        },
        userViewedMutation: function (state, userObject) {
            state.userViewed = cloneObject(userObject)
        },
        organizationMutation: function (state, organization) {
            state.organization = cloneObject(organization)
        },
    },
    actions: {
        userActorActions: function(context,userObject){
            context.commit('userActorMutation',userObject)
        },
        userViewedActions: function(context,userObject){
            context.commit(' userViewedMutation',userObject)
        },
        organizationActions: function(context,organization){
            context.commit('organizationMutation',organization)
        }
    },
    getters: {
        userActor: function(state){
            return cloneObject(state.userActor)
        },
        userViewed: function(state){
            return cloneObject(state.userViewed)
        },
        organization: function(state){
            return cloneObject(state.organization)
        },
    }
});
Vue.prototype.$store = vStore;
// End setting up vuex store