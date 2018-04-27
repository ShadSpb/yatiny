sap.ui.define([
	"sap/ui/core/UIComponent"
], function (UIComponent) {
	"use strict";

	return UIComponent.extend("yatiny.ui.resources.Component", {

		metadata : {
			manifest: "json",
			rootView: "yatiny.ui.resources.view.App",
			routing: {
				config: {
					routerClass: "sap.m.routing.Router",
					viewPath: "yatiny.ui.resources.view",
					controlId: "rootControl",
					controlAggregation: "pages",
					viewType: "XML"
				},
				routes: [
					{
						name: "welcome",
						// empty hash - normally the start page
						pattern: "Welcome",
						target: "welcome"
					},
					{
						name: "wizard",
						pattern: "Wizard",
						target: "wizard"
					},
					{
						name: "chart",
						pattern: "Chart",
						target: "chart"
					},
					{
						name: "archiving",
						pattern: "Archiving",
						target: "archiving"
					},
					{
						name: "hashtags",
						pattern: "Hashtags",
						target: "hashtags"
					},
					{
						name: "campaigns",
						pattern: "",
						target: "campaigns"
					},
					{
						name: "addCampaign",
						pattern: "Campaigns/Add",
						target: "addCampaign"
					},
					{
						name: "editCampaign",
						pattern: "Campaigns/{id}/Edit",
						target: "editCampaign"
					},
					{
						name: "campaign",
						pattern: "Campaigns/{id}",
						target: "campaign"
					}
				],
				targets: {
					welcome: {
						viewName: "Welcome",
						viewLevel: 1
					},
					wizard: {
						viewName: "Wizard",
						viewLevel: 1
					},
					chart: {
						viewName: "Chart",
						viewLevel: 1
					},
					archiving: {
						viewName: "ArchivingPage",
						viewLevel: 1
					},
					hashtags: {
						viewName: "HashtagsPage",
						viewLevel: 1
					},
					campaigns: {
						viewName: "CampaignsPage",
						viewLevel: 0
					},
					campaign: {
						viewName: "CampaignReportPage",
						viewLevel: 1
					},
					addCampaign: {
						viewName: "AddCampaignPage",
						viewLevel: 1
					},
					editCampaign: {
						viewName: "EditCampaignPage",
						viewLevel: 2
					}
				}
			}
		},

		init : function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
			
			this.getRouter().initialize();
		}

	});
});
