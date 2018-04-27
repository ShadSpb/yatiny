sap.ui.define([], function() {
	"use strict";
	jQuery.sap.declare("yatiny.ui.resources.model.formatter");

	return {
		/**
		 * Creates a human readable date
		 */
		date: function(date) {
			var oFormat = sap.ui.core.format.DateFormat.getInstance({
				format: "yMMMd"
			});
			return oFormat.format(date);
		},
		
		twoDates: function(date1, date2){
			console.log(date1);
			return this.date(date1) + " - " + this.date(date2);  
		}  
	};
}, true);
