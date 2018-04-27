/* 
eslint no-console: 0, 
no-multi-str: 0 
*/
"use strict";

const camelCase = require('camelcase');

const hdbext = require("@sap/hdbext");
const port = process.env.PORT || 3000;

const hana = require('./hana');
const campaignDAO = require('./db/campaign');

const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

const onSuccess = (res, data) => {
	res.writeHead(200, {
		"Content-Type": "application/json"
	});
	res.end(JSON.stringify(data ? data : null));
};

const onError = (res, error, code = 500) => {
	res.writeHead(code, {
		"Content-Type": "text/plain"
	});
	if (!(typeof error === 'string' || error instanceof String)){
		error = JSON.stringify(error);
	}
	res.end(error);
};

app.get("/archiving", function(req, res) {
	hana.exec(
			'SELECT NAME, RULE_OBJECT FROM (\
		SELECT T1.ID, T1.Name, T2.PROFILE_ID, T3.RULE_ID, T4.RULE_OBJECT \
		FROM "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE" AS T1 \
		INNER JOIN "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION" AS T2 ON T1.ID = T2.PROFILE_ID \
		INNER JOIN "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION_DESTINATION" AS T3 ON T2.ID = T3.PROFILE_VERSION_ID \
		INNER JOIN "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION_DESTINATION_RULE" AS T4 ON T3.RULE_ID = T4.ID) \
		WHERE NAME = \'Twitter\' OR NAME = \'VK\' OR NAME = \'Facebook\''
		)
		.then(settings => {
			const sourcesConfig = [];
			for (let i = 0; i < settings.length; i++) {
				const name = settings[i].NAME;
				const rule = JSON.parse(settings[i].RULE_OBJECT).sRuleExpression;
				if (!rule) {
					throw new Error('Archiving rule was not found.');
				}
				console.log(rule);
				const daysToBackup = Number(rule.match(/CURRENT_DATE,-([\d]*)/)[1]);
				if (daysToBackup < 0) {
					throw new Error('Error in initial archiving config. Please, contact your administrator.');
				} else {
					sourcesConfig.push({
						name: name,
						daysToBackup: daysToBackup
					});
				}
			}

			res.writeHead(200, {
				"Content-Type": "application/json"
			});
			res.end(JSON.stringify(sourcesConfig));
		})
		.catch(
			error => {
				console.log(error);
				res.writeHead(500, {
					"Content-Type": "text/plain"
				});
				res.end(error);
			}
		);
});

app.post('/archiving', function(req, res) {
	const sourceConfig = req.body;
	const daysToBackup = Number(sourceConfig.daysToBackup);
	console.log(typeof sourceConfig.daysToBackup);
	if (typeof daysToBackup !== "number" || daysToBackup < 0) {
		res.writeHead(500, {
			"Content-Type": "text/plain"
		});
		res.end('Invalid daysToBackup param. Expected number >= 0.');
	} else {
		hana.exec(
				'UPDATE "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION_DESTINATION_RULE" \
		SET RULE_OBJECT = \'{"RULE_TYPE_ID":1000,"sRuleExpression":"\\"DATE\\" > ADD_DAYS(CURRENT_DATE,-' +
				daysToBackup +
				')"}\' \
		WHERE ID = (select MAX(RULE_ID) from ( \
		select T1.ID,  T1.Name,  T2.PROFILE_ID, T3.RULE_ID, T4.RULE_OBJECT \
		from "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE" as T1 \
		inner join "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION" as T2 ON T1.ID = T2.PROFILE_ID \
		inner join "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION_DESTINATION" as T3 ON T2.ID = T3.PROFILE_VERSION_ID \
		inner join "SAP_HDM_DLM"."sap.hdm.dlm.core.db::DLM_PROFILE_VERSION_DESTINATION_RULE" as T4 ON T3.RULE_ID = T4.ID) \
		where NAME = \'' +
				sourceConfig.name + '\');')
			.then(result => {
				res.end();
			})
			.catch(
				error => {
					console.log(error);
					res.writeHead(500, {
						"Content-Type": "text/plain"
					});
					res.end(error);
				}
			);
	}

});

app.get('/campaigns', function(req, res) {
	campaignDAO.getCampaigns()
		.then(campaigns => {
			campaigns = campaigns.map(campaign => {
				campaign.twitterMentions = campaign.twitterMentions || 0;
				campaign.vkMentions = campaign.vkMentions || 0;
				campaign.startTime = campaign.startTime ? new Date(campaign.startTime) : null;
				campaign.endTime = campaign.endTime ? new Date(campaign.endTime) : null;
				return campaign;
			});

			res.writeHead(200, {
				"Content-Type": "application/json"
			});
			res.end(JSON.stringify(campaigns));
		})
		.catch(error => {
			console.log(error);
			res.writeHead(500, {
				"Content-Type": "text/plain"
			});
			res.end(error);
		});
});

app.post('/campaigns', function(req, res) {
	var params = req.body;
	var tags = params.tags.map(tag => tag.name);
	var startDate = new Date(params.startDate);
	var endDate = new Date(params.endDate);
	campaignDAO.addCampaign(params.name, params.description, params.sources, tags, startDate, endDate)
		.then(() => {
			res.writeHead(200, {
				"Content-Type": "application/json"
			});
			res.end("null");
		})
		.catch(error => {
			console.log(error);
			res.writeHead(500, {
				"Content-Type": "text/plain"
			});
			res.end(error);
		});
});

app.patch('/campaigns/:id', function(req, res) {
	var params = req.body;
	var tags = params.tags.map(tag => tag.name);
	var startDate = new Date(params.startDate);
	var endDate = new Date(params.endDate);
	campaignDAO.editCampaign(req.params.id, params.name, params.description, params.sources, tags, startDate, endDate)
		.then(() => onSuccess(res, {}))
		.catch(error => onError(res, error));
});

app.get('/campaigns/test', function(req, res) {
	campaignDAO.editCampaign(42, 'n', 'n', ['Twitter', "VK"], ['cooltag1', 'cooltag2'], new Date(), new Date())
		.then(res => console.log(JSON.stringify(res)))
		.catch(err => console.log(err));
});

app.get('/campaigns/:id', function(req, res) {
	hana.exec(`
		SELECT T1.NAME,T1.DESCRIPTION,T1.START_TIME,T1.END_TIME,T2.CONTROL_WORDS,T2.SOURCES,T2.CAMPAIGN_ID FROM CAMPAIGNS AS T1
		INNER JOIN (
		SELECT STRING_AGG(SOURCE,', ') AS "SOURCES", 
		FIRST_VALUE(CONTROL_WORDS ORDER BY CONTROL_WORDS) AS "CONTROL_WORDS", 
		CAMPAIGN_ID 
		FROM "SYSTEM"."STREAM_CONFIG_HISTORY" 
		WHERE "CAMPAIGN_ID" = ${req.params.id} GROUP BY CAMPAIGN_ID) AS T2 
		ON T1.ID = T2.CAMPAIGN_ID
	`)
	.then(campaigns => {
		campaigns = campaigns.map(campaign => {
			let camelCased = {};
			for (var property in campaign) {
				if (campaign.hasOwnProperty(property)) {
					camelCased[camelCase(property)] = campaign[property];
				}
			}
			return camelCased;
		});
		const campaign = campaigns[0];
		campaign.startTime = campaign.startTime ? new Date(campaign.startTime) : null;
		campaign.endTime = campaign.endTime ? new Date(campaign.endTime) : null;

		res.writeHead(200, {
			"Content-Type": "application/json"
		});
		res.end(JSON.stringify(campaign));
	})
	.catch(error => {
		console.log(error);
		res.writeHead(500, {
			"Content-Type": "text/plain"
		});
		res.end(error);
	});
});

app.delete('/campaigns/:id', function(req, res) {
	campaignDAO.deleteCampaign(req.params.id)
		.then(() => onSuccess(res, {}))
		.catch(error => onError(res, error));
});

app.get('/campaigns/:id/chart', function(req, res) {
	campaignDAO.getChart(req.params.id)
		.then(chart => onSuccess(res, chart))
		.catch(error => onError(res, error));
});

app.listen(port, function() {
	console.log("Example app listening on port %d!", port);
});
