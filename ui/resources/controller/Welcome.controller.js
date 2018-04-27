sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller'
], function(jQuery, Controller) {
	"use strict";

	Controller.extend("yatiny.ui.resources.controller.Welcome", {

		onInit: function() {},

		onInitialSetupPress: function() {
			this.getOwnerComponent().getRouter().navTo("wizard");
		},

		onConfigurationPress: function() {
			this.getOwnerComponent().getRouter().navTo("hashtags");
		},

		onArchivationPress: function() {
			this.getOwnerComponent().getRouter().navTo("archiving");
		},

		onChartPress: function() {
			this.getOwnerComponent().getRouter().navTo("chart");
		}
	});
});
