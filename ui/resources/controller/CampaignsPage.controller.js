/*eslint no-console: 0*/

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
	function(Controller, JSONModel) {
		"use strict";

		var ListController = Controller.extend("yatiny.ui.resources.controller.CampaignsPage", {

			onInit: function() {
				this.getOwnerComponent().getRouter().getRoute("campaigns")
					.attachPatternMatched(this.onPageOpened, this);
			},

			onPageOpened: function() {
				var campaignsList = this.getView().byId("campaigns_list");
				campaignsList.setBusy(true);
				var that = this;
				$.get("/campaigns")
					.done(function(campaigns) {
						campaigns.map(function(campaign) {
							campaign.startTime = campaign.startTime ? new Date(campaign.startTime) : null;
							campaign.endTime = campaign.endTime ? new Date(campaign.endTime) : null;
						});
						that.model = new JSONModel({
							campaigns: campaigns
						}, true);
						that.getView().setModel(that.model);
						campaignsList.setBusy(false);
					});
			},

			onCampaignPress: function(event) {
				var item = event.getSource();
				this.getOwnerComponent().getRouter().navTo("campaign", {
					id: item.getBindingContext().getProperty("id")
				});
			},

			onAddCampaignPress: function() {
				this.getOwnerComponent().getRouter().navTo("addCampaign", null, true);
			},

			onSettingsPress: function() {
				this.getOwnerComponent().getRouter().navTo("archiving", null, true);
			},

			formatDate: function(date) {
				var oFormat = sap.ui.core.format.DateFormat.getInstance({
					format: "yMMMd"
				});
				return date ? oFormat.format(date) : "?";
			},

			formatTwoDates: function(date1, date2) {
				return this.formatDate(date1) + " - " + this.formatDate(date2);
			},
			formatStatus: function(startDate, endDate) {
				if (!startDate || !endDate) {
					return "Error";
				} else if (startDate > new Date()) {
					return "Planned";
				} else if (endDate < new Date()) {
					return "Finished";
				} else {
					return "Active";
				}
			},
			
			formatMentions: function(twitter, vk) {
				return (twitter + vk).toLocaleString();
			}
		});
		return ListController;
	});