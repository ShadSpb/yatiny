/*eslint no-console: 0*/

sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", 
	"sap/m/MessageToast",
	"sap/ui/core/routing/History"],
	function(Controller, JSONModel, MessageToast, History) {
		"use strict";

		var ListController = Controller.extend("yatiny.ui.resources.controller.AddCampaignPage", {
			
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
					sources: {
						twitter: true,
						vk: false
					}
				}, true);
				this.getView().setModel(this.model);

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
					$.post("/campaigns", {
						name: model.name,
						description: model.description,
						tags: model.hashtags,
						startDate: model.startDate,
						endDate: model.endDate,
						sources: sources
					})
					.done(function(){
						that.onBack();
					})
					.fail(function(){
						MessageToast.show("Unable to save");
					});
				}
				else{
					MessageToast.show("Chose at least one source");
					console.log("Sources is empty"); 
				}
			},

			getSources: function() {
				var sources = [];
				var model = this.model.oData;
				if (model.sources.vk) {
					sources.push("VK");
				}
				if (model.sources.twitter) {
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