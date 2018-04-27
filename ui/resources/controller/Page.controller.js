sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	"sap/m/MessageToast",
	"sap/ui/core/routing/History"
], function(jQuery, Controller, JSONModel, MessageToast, History) {
	"use strict";

	Controller.extend("yatiny.ui.resources.controller.Page", {

		onInit: function() {},

		onBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			//The history contains a previous entry
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getOwnerComponent().getRouter().navTo("campaigns", null, true);
			}
		}
	});
});