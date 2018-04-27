/*eslint no-console: 0*/

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel",
		"sap/m/MessageToast",
		"sap/ui/core/routing/History"
	],
	function(Controller, JSONModel, MessageToast, History) {
		"use strict";

		var ListController = Controller.extend("yatiny.ui.resources.controller.EditCampaignPage", {

			onInit: function(oEvent) {
				// attach handler for validation errors
				sap.ui.getCore().getMessageManager().registerObject(this.getView().byId("newHashtag"), true);

				this.model = new JSONModel({
					name: "",
					description: "",
					newHashtag: "",
					hashtags: [],
					minDate: new Date(),
					startDate: new Date(),
					endDate: new Date(),
					sources: {}
				}, true);
				this.getView().setModel(this.model);

				this.router = sap.ui.core.UIComponent.getRouterFor(this);
				this.router.attachRoutePatternMatched(this._handleRouteMatched, this);
			},

			_handleRouteMatched: function(evt) {
				if (evt.getParameter("name") !== "editCampaign") {
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
						var sources = campaign.sources.split(", ");
						campaign.hashtags = campaign.controlWords.split(",").map(function(hashtag) {
							return {
								name: hashtag
							};
						});
						campaign.sources = {};
						var allSources = ["VK", "Twitter"];
						for (var i in allSources) {
							campaign.sources[allSources[i]] = sources.includes(allSources[i]) ? true : false;
						}
						campaign.isNotStarted = campaign.startTime > new Date();
						that.model.oData = campaign;
						that.model.refresh();
					});
			},

			onBack: function() {
				var sPreviousHash = History.getInstance().getPreviousHash();
				if (sPreviousHash !== undefined) {
					window.history.go(-1);
				} else {
					this.getOwnerComponent().getRouter().navTo("campaigns", null, true);
				}
			},

			onExit: function() {
				this.model.destroy();
			},

			onStartDateChange: function() {
				var model = this.model.oData;
				if (model.startDate > model.endDate) {
					model.endDate = model.startDate;
				}
			},

			addHashtag: function() {
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
				if (valid) {
					this.model.oData.hashtags.unshift({
						name: this.model.oData.newHashtag
					});
					this.model.oData.newHashtag = "";
					this.model.refresh();
				}
			},

			onEditHashtag: function() {
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

			handleSave: function() {
				var model = this.model.oData;
				var sources = this.getSources();
				var that = this;
				if (sources.length > 0) {
					$.ajax({
							url: "/campaigns/" + model.campaignId,
							type: "PATCH",
							data: {
								id: model.campaignId,
								name: model.name,
								description: model.description,
								tags: model.hashtags,
								startDate: model.startTime,
								endDate: model.endTime,
								sources: sources
							}
						})
						.done(function() {
							that.onBack();
						})
						.fail(function() {
							MessageToast.show("Unable to save");
						});
				} else {
					MessageToast.show("Chose at least one source");
					console.log("Sources is empty");
				}
			},

			getSources: function() {
				var sources = [];
				var model = this.model.oData;
				if (model.sources.VK) {
					sources.push("VK");
				}
				if (model.sources.Twitter) {
					sources.push("Twitter");
				}
				return sources;
			},

			handleDelete: function(oEvent) {
				var oList = oEvent.getSource();
				var oItem = oEvent.getParameter("listItem");
				var sPath = oItem.getBindingContext().getPath();
				var index = Number(sPath.substring("/hashtags/".length, sPath.length));

				this.model.oData.hashtags.splice(index, 1);
				this.model.oData.hashtagsSaved = false;
				this.model.refresh();

				oList.attachEventOnce("updateFinished", oList.focus, oList);
			}
		});

		return ListController;

	});