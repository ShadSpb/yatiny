/*eslint no-console: 0*/

sap.ui.define(['sap/ui/core/mvc/Controller','sap/ui/model/json/JSONModel', 'jquery.sap.global'],
	function(Controller, JSONModel, jQuery) {
	"use strict";
	
	var ListController = Controller.extend("yatiny.ui.resources.controller.HashtagsList", {

		onInit: function(oEvent) {
			// attach handler for validation errors
			sap.ui.getCore().getMessageManager().registerObject(this.getView().byId("newHashtag"), true);
			var that = this;
			$.get("/hashtags")
				.done(function(hashtags) {
					console.log(hashtags); 
					that.model = new JSONModel({
						hashtags: hashtags,
						newHashtag: "",
						minDate: new Date(),
						startDate: new Date(),
						endDate: new Date(), 
						hashtagsSaved: true
					}, true);
					that.getView().setModel(that.model);
				});
		},
		
		onExit : function() {
			this.model.destroy();
		},
		
		onStartDateChange: function(){
			var model = this.model.oData;
			if (model.startDate > model.endDate){
				model.endDate = model.startDate;
			}
		},
		
		addHashtag: function(){
			var view = this.getView();
			var newHashTag = view.byId("newHashtag");
			var oBinding = newHashTag.getBinding("value");
			var valid = true;
			try {
				oBinding.getType().validateValue(newHashTag.getValue());
			} catch (oException) {
				newHashTag.setValueState("Error");
				valid = false;
			}
			if (valid){
				this.model.oData.hashtags.unshift({name: this.model.oData.newHashtag});
				this.model.oData.newHashtag = "";
				this.model.oData.hashtagsSaved = false;
				this.model.refresh();
			}
		},
		
		onEditHashtag: function(){
			var view = this.getView();
			var newHashTag = view.byId("newHashtag");
			var oBinding = newHashTag.getBinding("value");
			try {
				oBinding.getType().validateValue(newHashTag.getValue());
				newHashTag.setValueState("None");
			} catch (oException) {
				newHashTag.setValueState("Error");
			}
		},
		
		saveHashtags: function(){
			var hashtags = this.model.oData.hashtags;
			var startDate = this.model.oData.startDate;
			var endDate = this.model.oData.endDate;
			var that = this;
			$.post("/hashtags", {tags: hashtags, startDate: startDate, endDate:  endDate}, function(result){
				console.debug(result);
				that.model.oData.hashtagsSaved = true;
			});
		},
		
		handleDelete: function(oEvent) {
			var oList = oEvent.getSource();
			var	oItem = oEvent.getParameter("listItem");
			var	sPath = oItem.getBindingContext().getPath();   
			var index = Number(sPath.substring("/hashtags/".length, sPath.length));
			
			this.model.oData.hashtags.splice(index, 1);
			this.model.oData.hashtagsSaved = false;
			this.model.refresh();
			
			oList.attachEventOnce("updateFinished", oList.focus, oList);
		}
		});
		
		return ListController;
 
});