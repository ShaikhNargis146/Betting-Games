myApp.directive('dateModel', function ($filter, $timeout) {
    return {
        scope: {
            model: '=ngModel'
        },
        link: function ($scope, element, attrs) {
            console.log("in date model");
            $timeout(function () {
                console.log($filter('date')(new Date($scope.model), 'dd/MM/yyyy'));
                $scope.model = new Date($scope.model);
            }, 100);

        }
    };
});


myApp.directive('imageonload', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('load', function () {
                scope.$apply(attrs.imageonload);
            });
        }
    };
});


// myApp.directive('uploadImage', function ($http, $filter, $timeout) {
//     return {
//         templateUrl: 'views/directive/uploadFile.html',
//         scope: {
//             model: '=ngModel',
//             type: "@type",
//             callback: "&ngCallback"
//         },
//         link: function ($scope, element, attrs) {
//             console.log($scope.model);
//             $scope.showImage = function () {};
//             $scope.check = true;
//             if (!$scope.type) {
//                 $scope.type = "image";
//             }
//             $scope.isMultiple = false;
//             $scope.inObject = false;
//             if (attrs.multiple || attrs.multiple === "") {
//                 $scope.isMultiple = true;
//                 $("#inputImage").attr("multiple", "ADD");
//             }
//             if (attrs.noView || attrs.noView === "") {
//                 $scope.noShow = true;
//             }
//             // if (attrs.required) {
//             //     $scope.required = true;
//             // } else {
//             //     $scope.required = false;
//             // }

//             $scope.$watch("image", function (newVal, oldVal) {
//                 console.log(newVal, oldVal);
//                 isArr = _.isArray(newVal);
//                 if (!isArr && newVal && newVal.file) {
//                     $scope.uploadNow(newVal);
//                 } else if (isArr && newVal.length > 0 && newVal[0].file) {

//                     $timeout(function () {
//                         console.log(oldVal, newVal);
//                         console.log(newVal.length);
//                         _.each(newVal, function (newV, key) {
//                             if (newV && newV.file) {
//                                 $scope.uploadNow(newV);
//                             }
//                         });
//                     }, 100);

//                 }
//             });

//             if ($scope.model) {
//                 if (_.isArray($scope.model)) {
//                     $scope.image = [];
//                     _.each($scope.model, function (n) {
//                         $scope.image.push({
//                             url: n
//                         });
//                     });
//                 } else {
//                     if (_.endsWith($scope.model, ".pdf")) {
//                         $scope.type = "pdf";
//                     }
//                 }

//             }
//             if (attrs.inobj || attrs.inobj === "") {
//                 $scope.inObject = true;
//             }
//             $scope.clearOld = function () {
//                 $scope.model = [];
//             };
//             $scope.uploadNow = function (image) {
//                 $scope.uploadStatus = "uploading";

//                 var Template = this;
//                 image.hide = true;
//                 var formData = new FormData();
//                 formData.append('file', image.file, image.name);
//                 $http.post(uploadurl, formData, {
//                     headers: {
//                         'Content-Type': undefined
//                     },
//                     transformRequest: angular.identity
//                 }).then(function (data) {
//                     data = data.data;
//                     $scope.uploadStatus = "uploaded";
//                     if ($scope.isMultiple) {
//                         if ($scope.inObject) {
//                             $scope.model.push({
//                                 "image": data.data[0]
//                             });
//                         } else {
//                             if (!$scope.model) {
//                                 $scope.clearOld();
//                             }
//                             $scope.model.push(data.data[0]);
//                         }
//                     } else {
//                         if (_.endsWith(data.data[0], ".pdf")) {
//                             $scope.type = "pdf";
//                         } else {
//                             $scope.type = "image";
//                         }
//                         $scope.model = data.data[0];
//                         console.log($scope.model, 'model means blob');

//                     }
//                     $timeout(function () {
//                         $scope.callback();
//                     }, 100);

//                 });
//             };
//         }
//     };
// });



myApp.directive('uploadImage', function ($http, $filter, $timeout, toastr) {
    return {
        templateUrl: 'views/directive/uploadFile.html',
        scope: {
            model: '=ngModel',
            type: "@type",
            callback: "&ngCallback"
        },
        link: function ($scope, element, attrs) {
            console.log($scope.model);
            $scope.showImage = function () {};
            $scope.check = true;
            if (!$scope.type) {
                $scope.type = "image";
            }
            $scope.isMultiple = false;
            $scope.inObject = false;
            if (attrs.multiple || attrs.multiple === "") {
                $scope.isMultiple = true;
                $("#inputImage").attr("multiple", "ADD");
            }
            if (attrs.noView || attrs.noView === "") {
                $scope.noShow = true;
            }
            // if (attrs.required) {
            //     $scope.required = true;
            // } else {
            //     $scope.required = false;
            // }

            $scope.$watch("image", function (newVal, oldVal) {
                // console.log("---------------",newVal, oldVal);
                isArr = _.isArray(newVal);
                if (!isArr && newVal && newVal.file) {
                    var numMatches = newVal.file.name.match(/([.])/g).length;
                    var text = newVal.file.name;
                    var result = /[^.]*$/.exec(text)[0];
                    $scope.uploadNow(newVal);
                } else if (isArr && newVal.length > 0 && newVal[0].file) {

                    $timeout(function () {
                        console.log(oldVal, newVal);
                        console.log(newVal.length);
                        _.each(newVal, function (newV, key) {
                            if (newV && newV.file) {
                                $scope.uploadNow(newV);
                            }
                        });
                    }, 100);
                }
            });

            if ($scope.model) {
                if (_.isArray($scope.model)) {
                    $scope.image = [];
                    _.each($scope.model, function (n) {
                        $scope.image.push({
                            url: n
                        });
                    });
                } else {
                    if (_.endsWith($scope.model, ".pdf")) {
                        $scope.type = "pdf";
                    }
                }

            }
            if (attrs.inobj || attrs.inobj === "") {
                $scope.inObject = true;
            }
            $scope.clearOld = function () {
                $scope.model = [];
            };
            $scope.uploadNow = function (image) {
                $scope.uploadStatus = "uploading";
                var Template = this;
                image.hide = true;
                var formData = new FormData();
                formData.append('file', image.file, image.name);
                $http.post(uploadurl, formData, {
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: angular.identity
                }).then(function (data) {
                    data = data.data;
                    console.log("$$$$$$4", data)
                    if (data.value == true) {
                        $scope.uploadStatus = "uploaded";
                        if ($scope.isMultiple) {
                            if ($scope.inObject) {
                                $scope.model.push({
                                    "image": data[0]
                                });
                            } else {
                                if (!$scope.model) {
                                    $scope.clearOld();
                                }
                                $scope.model.push(data.data[0]);
                            }
                        } else {
                            if (_.endsWith(data.data[0], ".pdf")) {
                                $scope.type = "pdf";
                            } else {
                                $scope.type = "image";
                            }
                            $scope.model = data.data[0];
                            // console.log($scope.model, 'model means blob')
                        }
                        $timeout(function () {
                            $scope.callback();
                        }, 100);
                    } else {
                        $scope.model = [];
                        $scope.uploadStatus = "";
                        toastr.error("Check File Format2");
                    }
                });
            };
        }
    };
});

myApp.directive('uploadImageFiles', function ($http, $filter, $timeout, toastr) {
    return {
        templateUrl: 'views/directive/uploadImageFiles.html',
        scope: {
            model: '=ngModel',
            type: "@type",
            callback: "&ngCallback"
        },
        link: function ($scope, element, attrs) {
            console.log($scope.model);
            $scope.showImage = function () {};
            $scope.check = true;
            if (!$scope.type) {
                $scope.type = "image";
            }
            $scope.isMultiple = false;
            $scope.inObject = false;
            if (attrs.multiple == "true") {
                $scope.isMultiple = true;
                $("#inputImage").attr("multiple", "ADD");
            }
            if (attrs.noView || attrs.noView === "") {
                $scope.noShow = true;
            }
            // if (attrs.required) {
            //     $scope.required = true;
            // } else {
            //     $scope.required = false;
            // }

            $scope.$watch("image", function (newVal, oldVal) {
                // console.log(newVal, oldVal);
                isArr = _.isArray(newVal);
                if (!isArr && newVal && newVal.file) {
                    var numMatches = newVal.file.name.match(/([.])/g).length;
                    var text = newVal.file.name;
                    var result = /[^.]*$/.exec(text)[0];
                    $scope.uploadNow(newVal);
                } else if (isArr && newVal.length > 0 && newVal[0].file) {
                    // console.log("new val", newVal);
                    $timeout(function () {
                        // console.log(oldVal, newVal);
                        // console.log(newVal.length);
                        async.eachLimit(newVal, 3, function (image, callback) {
                            // Perform operation on file here.
                            // console.log('Processing file ' + image);
                            var numMatches = image.file.name.match(/([.])/g).length;
                            var text = image.file.name;
                            var result = /[^.]*$/.exec(text)[0];
                            $scope.uploadStatus = "uploading";
                            var Template = this;
                            image.hide = true;
                            var formData = new FormData();
                            formData.append('file', image.file, image.file.name);
                            $http.post(uploadurl, formData, {
                                headers: {
                                    'Content-Type': undefined
                                },
                                transformRequest: angular.identity
                            }).then(function (data) {
                                data = data.data;
                                $scope.uploadStatus = "uploaded";
                                if ($scope.isMultiple) {
                                    if ($scope.inObject) {
                                        $scope.model.push({
                                            "image": data.data[0]
                                        });
                                        callback(null, "next");
                                    } else {
                                        if (!$scope.model) {
                                            $scope.clearOld();
                                        }
                                        var fileList = {};
                                        fileList.file = data.data[0];
                                        $scope.model.push(data.data[0]);
                                        callback(null, "next");
                                        $scope.imgGrp();
                                    }
                                } else {
                                    if (_.endsWith(data.data[0], ".pdf")) {
                                        $scope.type = "pdf";
                                    } else {
                                        $scope.type = "image";
                                    }
                                    var fileList = {};
                                    fileList.file = data.data[0];
                                    $scope.model = data.data[0];
                                    console.log($scope.model, 'model means blob')
                                    callback(null, "next");
                                }
                            });
                        }, function (err) {
                            // if any of the file processing produced an error, err would equal that error
                            if (err) {
                                // One of the iterations produced an error.
                                // All processing will now stop.
                                console.log('A file failed to process');
                            } else {
                                console.log('All files have been processed successfully');
                            }
                        });
                        // _.each(newVal, function (newV, key) {
                        //     if (newV && newV.file) {
                        //         $scope.uploadNow(newV);
                        //     }
                        // });
                    }, 15000);

                }
            });

            if ($scope.model) {
                if (_.isArray($scope.model)) {
                    $scope.image = [];
                    _.each($scope.model, function (n) {
                        $scope.image.push({
                            url: n
                        });
                    });
                    $scope.see = $scope.model.slice(0, 8);
                    $scope.length_img = $scope.model.length;
                    $scope.display_img = $scope.length_img;
                    $scope.display_img = $scope.display_img / 8;
                    $scope.display_img = Math.ceil($scope.display_img);
                    $scope.getNumber = function (num) {
                        return new Array(num);
                    }
                } else {
                    if (_.endsWith($scope.model, ".pdf")) {
                        $scope.type = "pdf";
                    }
                }

            }
            if (attrs.inobj || attrs.inobj === "") {
                $scope.inObject = true;
            }

            $scope.clearOld = function () {
                $scope.model = [];
                $scope.uploadStatus = "removed";
            };

            $scope.removeImage = function (index) {
                $scope.image = [];
                $scope.model.splice(($scope.pageNumber - 1) * 8 + index, 1);
                $scope.see = $scope.model.slice(0, 8);
                $scope.length_img = $scope.model.length;
                $scope.display_img = $scope.length_img;
                $scope.display_img = $scope.display_img / 8;
                $scope.display_img = Math.ceil($scope.display_img);
                $scope.getNumber = function (num) {
                    return new Array(num);
                }
                _.each($scope.model, function (n) {
                    $scope.image.push({
                        url: n
                    });
                });
            }
            $scope.uploadNow = function (image) {
                $scope.uploadStatus = "uploading";
                var Template = this;
                image.hide = true;
                var formData = new FormData();
                formData.append('file', image.file, image.file.name);
                $http.post(uploadurl, formData, {
                    headers: {
                        'Content-Type': undefined
                    },
                    transformRequest: angular.identity
                }).then(function (data) {
                    // console.log("data---", data);
                    data = data.data;
                    if (data.value == true) {
                        $scope.uploadStatus = "uploaded";
                        if ($scope.isMultiple) {
                            if ($scope.inObject) {
                                $scope.model.push({
                                    "image": data.data[0]
                                });
                            } else {
                                if (!$scope.model) {
                                    $scope.clearOld();
                                }
                                var fileList = {};
                                fileList.file = data.data[0];
                                $scope.model.push(data.data[0]);
                            }
                        } else {
                            if (_.endsWith(data.data[0], ".pdf")) {
                                $scope.type = "pdf";
                            } else {
                                $scope.type = "image";
                            }
                            var fileList = {};
                            fileList.file = data.data[0];
                            $scope.model = data.data[0];
                            // console.log($scope.model, 'model means blob')
                        }
                        $timeout(function () {
                            $scope.callback();
                        }, 15000);
                    } else {
                        $scope.model = [];
                        $scope.uploadStatus = "";
                        toastr.error("Check File Format");
                    }
                });
            };

            $scope.imgGrp = function () {
                $scope.length_img = $scope.model.length;
                $scope.display_img = $scope.length_img;
                $scope.display_img = $scope.display_img / 8;
                $scope.display_img = Math.ceil($scope.display_img);
                // console.log("qwerty-------", $scope.display_img);
                $scope.getNumber = function (num) {
                    return new Array(num);
                }
                if ($scope.length_img > 0) {
                    $scope.see = $scope.model.slice(0, 8);
                    $scope.pageNumber = 1;
                }
            }
            $scope.changePage = function (pageNo) {
                $scope.pageNumber = pageNo;
                if (pageNo == 1) {
                    console.log("1st page", pageNo);
                    $scope.see = $scope.model.slice(0, 8);
                } else {
                    console.log("pageNo", pageNo);
                    $scope.answer = (pageNo - 1) * 8;
                    $scope.multiplication = (8 * pageNo);
                    $scope.see = $scope.model.slice($scope.answer, $scope.multiplication);
                }
            }
            $scope.changePagefirst = function () {
                $scope.see = $scope.model.slice(0, 8);
                $scope.pageNumber = 1;
            }
            $scope.changePagelast = function () {
                $scope.answer = ($scope.display_img - 1) * 8;
                $scope.multiplication = (8 * $scope.display_img);
                $scope.see = $scope.model.slice($scope.answer, $scope.multiplication);
                $scope.pageNumber = $scope.display_img;
            }
            $scope.changePagePre = function () {
                if ($scope.pageNumber == 1) {
                    $scope.pageNumber = $scope.display_img + 1;
                }
                $scope.answer = (($scope.pageNumber - 2) * 8);
                $scope.multiplication = (8 * ($scope.pageNumber - 1));
                $scope.see = $scope.model.slice($scope.answer, $scope.multiplication);
                $scope.pageNumber = $scope.pageNumber - 1;
            }
            $scope.changePageNext = function () {
                if ($scope.pageNumber == $scope.display_img) {
                    $scope.pageNumber = 0;
                }
                $scope.answer = ($scope.pageNumber * 8);
                $scope.multiplication = (8 * ($scope.pageNumber + 1));
                $scope.see = $scope.model.slice($scope.answer, $scope.multiplication);
                $scope.pageNumber = $scope.pageNumber + 1;
            }
        }
    };
});



myApp.directive('onlyDigits', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attr, ctrl) {
            var digits;

            function inputValue(val) {
                if (val) {
                    var otherVal = val + "";
                    if (attr.type == "text") {
                        digits = otherVal.replace(/[^0-9\-\.\\]/g, '');
                    } else {
                        digits = otherVal.replace(/[^0-9\-\.\\]/g, '');
                    }


                    if (digits !== val) {
                        ctrl.$setViewValue(digits);
                        ctrl.$render();
                    }
                    return parseInt(digits, 10);
                }
                return undefined;
            }
            ctrl.$parsers.push(inputValue);
        }
    };
});

myApp.directive('img', function ($compile, $parse) {
    return {
        restrict: 'E',
        replace: false,
        link: function ($scope, element, attrs) {
            var $element = $(element);
            if (!attrs.noloading) {
                $element.after("<img src='img/loading.gif' class='loading' />");
                var $loading = $element.next(".loading");
                $element.load(function () {
                    $loading.remove();
                    $(this).addClass("doneLoading");
                });
            } else {
                $($element).addClass("doneLoading");
            }
        }
    };
});

// myApp.directive('fancyboxBox', function ($document) {
//     return {
//         restrict: 'EA',
//         replace: false,
//         link: function (scope, element, attr) {
//             var $element = $(element);
//             var target;
//             if (attr.rel) {
//                 target = $("[rel='" + attr.rel + "']");
//             } else {
//                 target = element;
//             }

//             target.fancybox({
//                 openEffect: 'fade',
//                 closeEffect: 'fade',
//                 closeBtn: true,
//                 helpers: {
//                     media: {}
//                 }
//             });
//         }
//     };
// });

myApp.directive('menuOptions', function ($document) {
    return {
        restrict: 'C',
        replace: false,
        link: function (scope, element, attr) {
            var $element = $(element);
            $(element).on("click", function () {
                $(".side-header.opened-menu").toggleClass('slide-menu');
                $(".main-content").toggleClass('wide-content');
                $("footer").toggleClass('wide-footer');
                $(".menu-options").toggleClass('active');
            });

        }
    };
});

myApp.directive('oI', function ($document) {
    return {
        restrict: 'C',
        replace: false,
        link: function (scope, element, attr) {
            var $element = $(element);
            $element.click(function () {
                $element.parent().siblings().children("ul").slideUp();
                $element.parent().siblings().removeClass("active");
                $element.parent().children("ul").slideToggle();
                $element.parent().toggleClass("active");
                return false;
            });

        }
    };
});
myApp.directive('slimscroll', function ($document) {
    return {
        restrict: 'EA',
        replace: false,
        link: function (scope, element, attr) {
            var $element = $(element);
            $element.slimScroll({
                height: '400px',
                wheelStep: 10,
                size: '2px'
            });
        }
    };
});

myApp.directive('addressForm', function ($document) {
    return {
        templateUrl: 'views/directive/address-form.html',
        scope: {
            formData: "=ngModel",
            demoForm: "=ngValid"
        },
        restrict: 'EA',
        replace: false,
        controller: function ($scope, NgMap, NavigationService) {

            $scope.map = {};
            $scope.change = function () {
                NgMap.getMap().then(function (map) {
                    var latLng = {
                        lat: map.markers[0].position.lat(),
                        lng: map.markers[0].position.lng()
                    };
                    _.assign($scope.formData, latLng);
                });
            };
            var LatLongi = 0;
            $scope.getLatLng = function (address) {

                NavigationService.getLatLng(address, ++LatLongi, function (data, i) {

                    if (i == LatLongi) {
                        $scope.formData = _.assign($scope.formData, data.results[0].geometry.location);
                    }
                });
                // $http.get("http://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyCn9ypqFNxdXt9Zu2YqLcdD1Xdt2wNul9s&address="+address);
            };

        },
        // link: function($scope, element, attr, NgMap) {
        //     var $element = $(element);
        //     $scope.demoForm = {};
        //     $scope.demoForm.lat = 19.0760;
        //     $scope.demoForm.long = 72.8777;
        //     $scope.map = {};
        //     $scope.change = function() {
        //       NgMap.getMap().then(function(map) {
        //         console.log(map);
        //       });
        //
        //     };
        //
        // }
    };
});

// myApp.directive('box', function ($uibModal) {
//     return {
//         templateUrl: 'views/directive/box.html',
//         scope: {
//             type: '=type',
//             model: '=ngModel'
//         },
//         link: function ($scope, element, attrs) {
//             $scope.model = {};
//             console.log($scope.model);
//             $scope.data = {};
//             $scope.eventModel = function (text) {
//                 $scope.type.state = text;
//                 var modalInstance = $uibModal.open({
//                     animation: $scope.animationsEnabled,
//                     templateUrl: '/backend/views/modal/modal.html',
//                     size: 'lg',
//                     scope: $scope
//                 });
//                 $scope.close = function (value) {
//                     callback(value);
//                     modalInstance.close("cancel");
//                 };
//             };
//             $scope.submitModal = function (moddata) {
//                 console.log(moddata);
//             };
//         }
//     };
// });

var aa = {};
myApp.directive('multipleSelect', function ($document, $timeout) {
    return {
        templateUrl: 'views/directive/multiple-select.html',
        scope: {
            model: '=ngModel',
            api: "@api",
            url: "@url",
            name: "@name",
            required: "@required",
            filter: "@filter",
            ngName: "=ngName",
            create: "@ngCreate",
            disabled: "=ngDisabled"

        },
        restrict: 'EA',
        replace: false,
        controller: 'MultipleSelectCtrl',
        link: function (scope, element, attr, NavigationService) {
            var $element = $(element);
            scope.activeKey = 0;
            scope.isRequired = true;
            if (scope.required === undefined) {
                scope.isRequired = false;
            }
            scope.typeselect = attr.typeselect;
            // $scope.searchNew()
            aa = $element;
            var maxItemLength = 40;
            var maxBoxLength = 200;
            $timeout(function () {

                $element.find(".typeText").keyup(function (event) {
                    var scrollTop = $element.find("ul.allOptions").scrollTop();
                    var optionLength = $element.find("ul.allOptions li").length;
                    if (event.keyCode == 40) {
                        scope.activeKey++;
                    } else if (event.keyCode == 38) {
                        scope.activeKey--;
                    } else if (event.keyCode == 13) {
                        $element.find("ul.allOptions li").eq(scope.activeKey).trigger("click");
                    }
                    if (scope.activeKey < 0) {
                        scope.activeKey = optionLength - 1;
                    }
                    if (scope.activeKey >= optionLength) {
                        scope.activeKey = 0;
                    }
                    var newScroll = -1;
                    var scrollVisibility = (scrollTop + maxBoxLength) - maxItemLength;
                    var currentItemPosition = scope.activeKey * maxItemLength;
                    if (currentItemPosition < scrollTop) {
                        newScroll = (maxItemLength * scope.activeKey);

                    } else if (currentItemPosition > scrollVisibility) {
                        newScroll = (maxItemLength * scope.activeKey);

                    }
                    if (newScroll != -1) {
                        $element.find("ul.allOptions").scrollTop(newScroll);
                    }

                    scope.$apply();
                });

            }, 100);

        }
    };
});



myApp.directive('viewField', function ($http, $filter, NavigationService, $uibModal) {
    return {
        templateUrl: 'views/directive/viewField.html',
        scope: {
            type: '=type',
            value: "=value"
        },
        link: function ($scope, element, attrs) {
            if (!$scope.type.type) {
                $scope.type.type = "text";
            }
            $scope.form = {};
            $scope.objectDepth = function () {
                if (_.isObjectLike($scope.storeObj)) {
                    if ($scope.storeValue[$scope.storeObj.field]) {
                        $scope.form.model = $scope.storeValue[$scope.storeObj.tableRef][$scope.storeObj.field];
                        $scope.storeObj = $scope.storeObj.tableRef;
                        if (_.isObjectLike($scope.storeObj)) {
                            $scope.objectDepth();
                        }
                    }
                }
            };
            if (_.isObjectLike($scope.value[$scope.type.tableRef])) {
                $scope.storeObj = $scope.type;
                $scope.storeValue = $scope.value;
                $scope.objectDepth();

            } else {
                $scope.form.model = $scope.value[$scope.type.tableRef];
            }

            $scope.template = "views/viewField/" + $scope.type.type + ".html";


            $scope.modalopen = function () {
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'views/modal/' + $scope.type.modal + '.html',
                    size: 'md',
                    scope: $scope
                });
                $scope.close = function (value) {
                    callback(value);
                    modalInstance.close("cancel");
                };
            };


            // Function for Give 
            $scope.giveTap = function (amount, userId) {
                NavigationService.apiCall('member/transactionMoney', {
                    amount: Math.abs(amount),
                    id: userId,
                    type: "Give"
                }, function (data) {
                    console.log("give...", data);
                })
            };

            // Function for Take
            $scope.takeTap = function (amount, userId) {
                NavigationService.apiCall('member/transactionMoney', {
                    amount: Math.abs(amount),
                    id: userId,
                    type: "Take"
                }, function (data) {
                    console.log("take...", data);
                })
            };
        }
    };
});
myApp.directive('dateForm', function () {
    return {
        scope: {
            ngModel: '=ngModel'
        },
        link: function ($scope, element, attrs) {
            console.log($scope.ngModel);
        }
    };
});

myApp.directive('detailField', function ($http, $filter, JsonService) {
    return {
        templateUrl: 'views/directive/detailField.html',
        scope: {
            type: '=type',
            value: "=value",
            detailForm: "=form",
            formData: "=data",
        },
        controller: 'DetailFieldCtrl',
        link: function ($scope, element, attrs) {}
    };
});