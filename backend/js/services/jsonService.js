myApp.service('JsonService', function ($http, TemplateService, $state, toastr, $uibModal, NavigationService) {
  this.json = {};
  this.keyword = {};
  // this.refreshView;
  var JsonService = this;
  this.setKeyword = function (data) {
    try {
      this.keyword = JSON.parse(data);
      console.log(this.keyword);
    } catch (e) {
      console.log("keyword is not is json format");
    }
  };
  this.getJson = function (page, callback) {
    $http.get("pageJson/" + page + ".json").then(function (data) {
      data = data.data;
      JsonService.json = data;
      switch (data.pageType) {
        case "view":
          {
            TemplateService.changecontent("view");
          }
          break;

        case "create":
          {
            TemplateService.changecontent("detail");
          }
          break;

        case "edit":
          {
            TemplateService.changecontent("detail");
          }
          break;
      }
      callback();
    });

  };
  this.deleteFunction = function (callback) {

    var modalInstance = $uibModal.open({
      // animation: $scope.animationsEnabled,
      templateUrl: '/backend/views/modal/conf-delete.html',
      size: 'sm',
      scope: this
    });
    // this.close = function (value) {
    //   callback(value);
    //   modalInstance.close("cancel");
    // };
  };

  var openCustomModal = function (size, title, message) {
    // var actionToPerformOnConfirm = action;
    console.log("in model");
    var modalInstance = $uibModal.open({
      templateUrl: '/backend/views/modal/conf-delete.html',
      size: "lg",
      resolve: {
        title: title,
        message: message
      }
    });
  };

  this.eventModal = function (value) {
    console.log(value);
  };


  this.eventAction = function (action, value) {
    var sendTo = {
      id: action.action
    };
    console.log(action);
    if (action.type == "box") {
      JsonService.modal = action;
      globalfunction.openModal(function (data) {
        console.log(data);
      });
    } else if (action.type == "redirect") {
      if (action.linkType == "admin") {
        window.location.href = adminurl + action.action;
      } else if (action.linkType == "internal") {
        window.location.href = "#!/" + action.action;
      } else {
        window.location.href = action.action;
      }
    } else {
      if (value && action && action.fieldsToSend) {
        var keyword = {};
        _.each(action.fieldsToSend, function (n, key) {
          keyword[key] = value[n];
        });
        sendTo.keyword = JSON.stringify(keyword);
      }
      if (action && action.type == "page") {
        $state.go("page", sendTo);
      } else if (action && action.type == "apiCallConfirm") {
        globalfunction.confDel(function (value2) {
          if (value2) {
            NavigationService.delete(action.api, value, function (data) {
              if (data.value) {
                toastr.success(JsonService.json.title + " deleted successfully.", JsonService.json.title + " deleted");
                JsonService.refreshView();
              } else {
                toastr.error("There was an error while deleting " + JsonService.json.title, JsonService.json.title + " deleting error");
              }
            });
          }
        });
      }
    }
  };





});