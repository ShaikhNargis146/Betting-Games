myApp.service('TemplateService', function () {
  this.title = "Home";
  this.meta = "Google";
  this.metadesc = "Home";
  this.pageMax = 10;
  this.adminurl = adminurl;
  this.accessTokenUrl = adminurl;
  var d = new Date();
  this.year = d.getFullYear();
  this.profile = $.jStorage.get("profile");
  this.init = function () {
    this.header = "views/header.html";
    this.menu = "views/menu.html";
    this.content = "views/content/content.html";
    this.footer = "views/footer.html";
    this.profile = $.jStorage.get("profile");
  };

  this.changecontent = function (page) {
    this.init();
    var data = this;
    data.content = "views/content/" + page + ".html";
    return data;
  };

  this.init();

});