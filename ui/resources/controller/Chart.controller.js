sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/ui/core/routing/History"
], function(jQuery, Controller, JSONModel, MessageToast, History) {
	"use strict";

	Controller.extend("yatiny.ui.resources.controller.Chart", {

		onInit: function() {
			var oVizFrame = this.getView().byId("idVizFrame");
			oVizFrame.setVizProperties({
				title: {
					text: "Mentions by day"
				},
				plotArea: {
					secondaryValuesColorPalette: ["green", "orange", "red", "black"]
				}
			});
			var oTooltip = new sap.viz.ui5.controls.VizTooltip({});
            oTooltip.connect(oVizFrame.getVizUid());
			
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.subscribe(
				"campaignIdBus",
				"chartParams",
				this.idHandler,
				this);

			this.model = new JSONModel({
				filterFrom: null,
				filterTo: null,
				currentSource: {},
				sources: []
			});
			this.getView().setModel(this.model);
		},

		idHandler: function(channelId, eventId, chartParams) {
			var that = this;

			$.getJSON("/campaigns/" + chartParams.id + "/chart", function(sources) {
				for (var i = 0; i < sources.length; i++) {
					var data = sources[i].data;
					for (var j = 0; j < data.length; j++) {
						data[j].date = new Date(data[j].date);
					}
				}

				that.model.oData.sources = sources;
				that.model.oData.filterFrom = chartParams.dateFrom;
				that.model.oData.filterTo = chartParams.dateTo;
				that.model.refresh();
				
				var chartName = sources[0].name;
				that.setChart(chartName); 
				that.oView.byId("sourceSelector").setSelectedKey(chartName);
			});
		},

		onBack: function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getOwnerComponent().getRouter().navTo("wizard", null, true);
			}
		},

		onPersonalizationPress: function() {
			MessageToast.show("Coming soon: hiding lines");
		},

		onSourceChanged: function(event) {
			var sourceName = event.getParameters().selectedItem.getKey();
			this.setChart(sourceName); 
		},
		
		setChart: function(name) {
			this.model.oData.currentSource = this.model.oData.sources.find(function(source) {
				return source.name === name;
			}) || {};
			console.log(this.model.oData.currentSource + ' ' + name + ' in set chart');
			this.model.refresh();
		},

		onDateChange: function(oEvent) {
			var sFrom = oEvent.getParameter("from");
			var sTo = oEvent.getParameter("to");
			var bValid = oEvent.getParameter("valid");

			this._iEvent++;

			var oDRS = oEvent.oSource;
			if (bValid) {
				oDRS.setValueState(sap.ui.core.ValueState.None);
				var oVizFrame = this.getView().byId("idVizFrame");

				var oFilters = [];
				var filter = new sap.ui.model.Filter("date", sap.ui.model.FilterOperator.BT, sFrom, sTo);
				oFilters.push(filter);

				oVizFrame.getDataset().getBinding("data").filter(oFilters);
			} else {
				oDRS.setValueState(sap.ui.core.ValueState.Error);
			}
		}
	});
});