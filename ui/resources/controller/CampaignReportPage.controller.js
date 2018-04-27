/*eslint no-console: 0*/

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "sap/m/Button",
		"sap/m/Dialog", "sap/m/Text"
	],
	function(Controller, JSONModel, History, Button, Dialog, Text) {
		"use strict";

		var ListController = Controller.extend("yatiny.ui.resources.controller.CampaignReportPage", {

			onInit: function() {
				this.router = sap.ui.core.UIComponent.getRouterFor(this);
				this.router.attachRoutePatternMatched(this._handleRouteMatched, this);
			},

			onBack: function() {
				var sPreviousHash = History.getInstance().getPreviousHash();
				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					this.getOwnerComponent().getRouter().navTo("campaigns", null, true);
				}
			},

			onDeleteCampaign: function() {
				var that = this;
				var dialog = new Dialog({
					title: "Confirm",
					type: "Message",
					content: new Text({
						text: "Are you sure you want to delete this campaign?"
					}),
					beginButton: new Button({
						text: "Delete",
						press: function() {
							$.ajax({
									"url": "/campaigns/" + that.model.oData.campaignId,
									"type": "DELETE"
								})
								.done(function() {
									dialog.close();
									that.onBack();
								});
						}
					}),
					endButton: new Button({
						text: "Cancel",
						press: function() {
							dialog.close();
						}
					}),
					afterClose: function() {
						dialog.destroy();
					}
				});

				dialog.open();
			},
			
			onEditCampaign: function() {
				this.getOwnerComponent().getRouter().navTo("editCampaign", {
					id: this .model.oData.campaignId
				});
			},
			
			_handleRouteMatched: function(evt) {
				if (evt.getParameter("name") !== "campaign") {
					return;
				}
				var id = evt.getParameter("arguments").id;
				this.model = new JSONModel({
					campaignId: id
				}, true);
				this.getView().setModel(this.model);

				var that = this;
				$.get("/campaigns/" + id)
					.done(function(campaign) {

						campaign.startTime = campaign.startTime ? new Date(campaign.startTime) : null;
						campaign.endTime = campaign.endTime ? new Date(campaign.endTime) : null;

						var oEventBus = sap.ui.getCore().getEventBus();
						oEventBus.publish("campaignIdBus", "chartParams", {
							id: id,
							dateFrom: campaign.startTime,
							dateTo: campaign.endTime
						});
						that.model.oData.campaign = campaign;
						that.model.refresh();
					});
			},
			
			

			formatDate: function(date) {
				var oFormat = sap.ui.core.format.DateFormat.getInstance({
					format: "yMMMd"
				});
				return date ? oFormat.format(date) : "?";
			},

			formatTwoDates: function(date1, date2) {
				console.log(date1);
				return this.formatDate(date1) + " - " + this.formatDate(date2);
			}
		});
		return ListController;
	});