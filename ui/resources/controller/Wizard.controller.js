/* 
eslint no-console: 0
*/
sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
	"sap/ui/core/routing/History"
], function(jQuery, Controller, History) {
	"use strict";


	Controller.extend("yatiny.ui.resources.controller.Wizard", {
		onInit: function() {},
		
		onToPage2: function() {
			this.getOwnerComponent().getRouter().navTo("chart");
		},

		onExternalLinkPress: function() {
			window.open("http://ip-172-30-0-111.asdfz.net:8000/sap/hana/ide/editor/");
		},

		onExternalLinkPressArch: function() {
			window.open("http://172.30.0.111:8000/sap/hdm/dlm/index.html?NavigationTarget=DLM_Home");
		},
		
		onBack : function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			//The history contains a previous entry
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				// There is no history!
				// replace the current hash with page 1 (will not add an history entry)
				this.getOwnerComponent().getRouter().navTo("welcome", null, true);
			}
		}
	});

});