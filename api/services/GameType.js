var schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
       
    },
    totalCards:{
       type: Number ,
       required: true
    },
    evaluateFunc:{
        type: String,
        required: true
    },
    currentType: {
        type: Boolean,
        default: false
    },
    jokerCard : String
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('GameType', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema));
var model = {
    makeCurrentType: function(data, callback){
         var model = this;
           if(_.isEmpty(data)){
               callback("Send Valid Data");
               return 0;
           }         
       
           GameType.find({}).exec(function(err, gameData){
               console.log("gameData", gameData);
               var selectedIndex = _.findIndex(gameData, function(data){
                   return data.currentType;
               });
              console.log("selectedIndex", selectedIndex);
               if(selectedIndex >= 0){
                gameData[selectedIndex].currentType = false;
                gameData[selectedIndex].save(function(data){});
               }

               var requestGame = _.findIndex(gameData,function(gtData){
                   console.log(data._id, gtData._id);
                       return ((data._id + "") == (gtData._id + ""));
               });

               console.log("requestGame", requestGame);
               if(requestGame >= 0){
                   console.log("inside");
                gameData[requestGame].currentType = true;
                gameData[requestGame].save(function(data){}); 
               } 
               callback();
           });
    }
};
module.exports = _.assign(module.exports, exports, model);