/* 
eslint no-console: 0
*/
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel'
], function(jQuery, Controller, JSONModel) {
	"use strict";


	Controller.extend("yatiny.ui.resources.controller.Archiving", {
		onInit: function() {
			
			var that = this;
			$.get("/archiving")
				.done(function(config) {
					console.log(config);
					for (var i = 0; i < config.length; i++){
						config[i].oldDaysToBackup = config[i].daysToBackup;
						config[i].status = "NOT_CHANGED";
					}
					that.model = new JSONModel({
						config: config
					}, true);
					that.getView().setModel(that.model);
					sap.ui.getCore().getMessageManager().registerObject(that.getView().byId("archiving_input-__xmlview2--archiving_table-0"), true);
				});
		},
		// TODO fix multiple value checking
		saveArchivationParams: function(){
			var configs = this.model.oData.config;
			configs.forEach(function(config)
			{
				if (config.status === "NOT_SAVED"){
					config.status = "SAVING";
					$.post("/archiving", {name: config.name, daysToBackup: config.daysToBackup})
					.done(function(result){
						console.debug(result);
						config.status = "SAVED";
					})
					.fail(function(error){
						console.debug(error);
						config.status = "ERROR";
					});
				}	
			});
			
		},
		
		statusColorFormatter: function(status){
			var states = {
				NOT_CHANGED: "None",
				NOT_SAVED: "Warning",
				SAVING: "None",
				SAVED: "Success",
				ERROR: "Error"
			};
			return states[status]; 
		},
		
		statusTextFormatter: function(status){
			var states = {
				NOT_CHANGED: "Not changed",
				NOT_SAVED: "Unsaved changes",
				SAVING: "Saving...",
				SAVED: "Saved",
				ERROR: "Error during saving"
			};
			return states[status]; 
		},

		onArchivationItemLiveChange: function(event) {
			var	sPath = event.getSource().mBindingInfos.value.binding.oContext.sPath;  
			var index = Number(sPath.substring("/config/".length, sPath.length));
			var configs = this.model.oData.config;
			if (Number(configs[index].daysToBackup) === configs[index].oldDaysToBackup){
				configs[index].status = "NOT_CHANGED";
			}
			else{
				configs[index].status = "NOT_SAVED";
			}
		}
	});
});