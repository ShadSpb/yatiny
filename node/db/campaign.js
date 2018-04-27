"use strict";

const hana = require('../hana');
const toCamelCase = require('../utils/utils').toCamelCase;
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const sourceTable = {
	"Twitter": "TWITTER_STREAM_RESULT",
	"VK": "VK_STREAM_RESULT"
};

exports.getCampaigns = () => 
	hana.exec(`
		SELECT 
			C.ID, C.NAME, C.DESCRIPTION, 
			C.START_TIME, C.END_TIME, 
			INFO.CONTROL_WORDS, INFO.SOURCES,
			TWITTER.COUNT AS TWITTER_MENTIONS,
			VK.COUNT AS VK_MENTIONS
			
		FROM CAMPAIGNS AS C
			JOIN ( SELECT
				STRING_AGG(SOURCE,', ') AS "SOURCES", 
				FIRST_VALUE(CONTROL_WORDS ORDER BY CONTROL_WORDS) AS "CONTROL_WORDS", 
				CAMPAIGN_ID FROM "SYSTEM"."STREAM_CONFIG_HISTORY" 
					WHERE "CAMPAIGN_ID" NOT LIKE '?' 
					GROUP BY CAMPAIGN_ID
				) AS INFO
			ON C.ID = INFO.CAMPAIGN_ID
			
			LEFT JOIN (
				SELECT COUNT(*) AS COUNT, C.ID FROM "SYSTEM"."TWITTER_STREAM_RESULT" AS T
				JOIN CAMPAIGNS AS C 
				ON T.FULL_TIMESTAMP
				BETWEEN C.START_TIME
				AND C.END_TIME
				GROUP BY C.ID 
			) AS TWITTER
			ON C.ID = TWITTER.ID
			
			LEFT JOIN (
				SELECT COUNT(*) AS COUNT, C.ID FROM "SYSTEM"."VK_STREAM_RESULT" AS T
				JOIN CAMPAIGNS AS C 
				ON TO_TIMESTAMP(CONCAT(TO_VARCHAR(T.DATE), TO_VARCHAR(T.TIME)), 'YYYY-MM-DDHH24:MI:SS') 
				BETWEEN C.START_TIME
				AND C.END_TIME
				GROUP BY C.ID
			) AS VK
			ON C.ID = VK.ID
		ORDER BY C.START_TIME DESC, C.END_TIME DESC
	`)
	.then(campaigns => campaigns.map(toCamelCase));

exports.getSources = campaignId =>
	hana.exec(`SELECT SOURCE FROM "SYSTEM"."STREAM_CONFIG_HISTORY" WHERE CAMPAIGN_ID = ${campaignId}`)
	.then(res => res.map(source => source.SOURCE));

exports.getSourceChart = (campaignId, table) =>
	hana.exec(`
		SELECT "POSTS"."DATE", "ALL", "POSITIVE", "NEUTRAL", "NEGATIVE", "RATED", "UNRATED" FROM (
			SELECT 
				DATE, 
				COUNT(*) AS "ALL", 
				SUM(CASE WHEN VALUE > 2 THEN 1 ELSE 0 END) AS POSITIVE, 
				SUM(CASE WHEN VALUE BETWEEN -2 AND 2 THEN 1 ELSE 0 END) AS NEUTRAL, 
				SUM(CASE WHEN VALUE < -2 THEN 1 ELSE 0 END) AS NEGATIVE, 
				SUM(CASE WHEN VALUE IS NOT NULL THEN 1 ELSE 0 END) AS RATED, 
				SUM(CASE WHEN VALUE IS NULL THEN 1 ELSE 0 END) AS UNRATED
			FROM "${table}"
			WHERE TO_TIMESTAMP(CONCAT(TO_VARCHAR(DATE), TO_VARCHAR(TIME)), 'YYYY-MM-DDHH24:MI:SS') 
				BETWEEN (SELECT START_TIME FROM CAMPAIGNS WHERE ID=${campaignId})
				AND (SELECT END_TIME FROM CAMPAIGNS WHERE ID=${campaignId}) 
			GROUP BY DATE
			) AS POSTS
			
	`);
	// Information about sales was removed, because it show bullshit
	//Initial request please check in mail from Egor Gumin

exports.getChart = campaignId =>
	this.getSources(campaignId)
	.then(sources => {
		const queries = sources.map(source => {
			const table = sourceTable[source];
			if (table) {
				return this.getSourceChart(campaignId, table);
			} else {
				throw new Error(`Unknown source: ${source}`);
			}
		});
		return Promise.all(queries)
			.then(charts => {
				charts = charts.map((chart, index) => 
					({
						name: sources[index],
						data: chart.map(toCamelCase)
					})
				);
				if (charts.length > 1){
					charts.sort((chart1, chart2) => chart1.name.localeCompare(chart2.name));
					// The fastest and out of the box way, but... yep, it looks terrible
					const data = JSON.parse(JSON.stringify(charts[0].data));
					for (let i = 1; i < charts.length; i++){
						charts[i].data.forEach(newDay => {
							let equalDay = data.find(day => day.date === newDay.date);
							if (equalDay){
								equalDay.all += newDay.all;
						        equalDay.positive += newDay.positive;
						        equalDay.neutral += newDay.neutral;
						        equalDay.negative += newDay.negative;
						        equalDay.rated += newDay.rated;
						        equalDay.unrated += newDay.unrated;
							}
							else{
								data.push(Object.assign({}, newDay));
							}
							
						});
						
					}
					data.sort((day1, day2) => day1.date.localeCompare(day2.date));
					charts.unshift({name: 'All', data: data});
				}
				return charts;
			});
	});
	
const getMaxCampaignId = () => 
	hana.exec(`SELECT MAX(ID) AS ID FROM "SYSTEM"."CAMPAIGNS"`)
	.then(ids => ids[0] ? ids[0].ID : -1);
	
const getMaxSourceId = () => 
	hana.exec(`SELECT MAX(ID) AS ID FROM "SYSTEM"."STREAM_CONFIG_HISTORY"`)
	.then(ids => ids[0] ? ids[0].ID : -1);
	
const insertCampaign = (id, name, description, startTime, endTime) =>
	hana.exec(`
		INSERT INTO "SYSTEM"."CAMPAIGNS" 
		(ID, NAME, DESCRIPTION, START_TIME, END_TIME) VALUES 
		(${id}, '${name}', '${description}', TO_TIMESTAMP('${startTime.toISOString()}'), TO_TIMESTAMP('${endTime.toISOString()}'))
	`);
	
const insertSource = (id, source, tags, campaignId) =>
	hana.exec(`
		INSERT INTO "SYSTEM"."STREAM_CONFIG_HISTORY" 
		(ID, SOURCE, CONTROL_WORDS, CAMPAIGN_ID) VALUES 
		(${id}, '${source}', '${tags.join(',')}', ${campaignId})
	`);
	
// TODO validation on empty tags
exports.addCampaign = (name, description, sources, tags, startTime, endTime) => {
	let campaignId = null;
	
	return hana.exec(`
		UPDATE "SYSTEM"."CAMPAIGNS" SET 
			END_TIME = TO_TIMESTAMP('${startTime.toISOString()}') 
		WHERE END_TIME >= TO_TIMESTAMP('${startTime.toISOString()}')
	`)
	.then(() => getMaxCampaignId())
	.then(id => {
		campaignId = id + 1;
		return insertCampaign(campaignId, name, description, startTime, endTime);
	})
	.then(() => getMaxSourceId())
	.then(id => {
		const freeId = id + 1;
		const insertResults = sources.map((source, index) => insertSource(freeId + index, source, tags, campaignId));
		return Promise.all(insertResults);
	});
};

exports.editCampaign = async((campaignId, name, description, sources, tags, startTime, endTime) => {
	await(hana.exec(`
		UPDATE "SYSTEM"."CAMPAIGNS" SET END_TIME = TO_TIMESTAMP('${startTime.toISOString()}') 
		WHERE END_TIME >= TO_TIMESTAMP('${startTime.toISOString()}')
	`));
	
	await(hana.exec(`
		UPDATE "SYSTEM"."CAMPAIGNS" SET 
			NAME='${name}', 
			DESCRIPTION='${description}',
			START_TIME=TO_TIMESTAMP('${startTime.toISOString()}'),
			END_TIME=TO_TIMESTAMP('${endTime.toISOString()}')
		WHERE ID=${campaignId}
	`));
	
	await(hana.exec(`DELETE FROM "SYSTEM"."STREAM_CONFIG_HISTORY"  WHERE CAMPAIGN_ID=${campaignId}`));
	
	const freeSourceId = await(getMaxSourceId()) + 1;
	const insertResults = sources.map((source, index) => insertSource(freeSourceId + index, source, tags, campaignId));
	return Promise.all(insertResults);
});

exports.deleteCampaign = campaignId =>
	hana.exec(`
		DELETE FROM "SYSTEM"."CAMPAIGNS" WHERE ID=${campaignId}
		`);

exports.getMentions = campaignId => 
	hana.exec(`
		SELECT
			COUNT(*) AS "COUNT", 'Twitter' AS "SOURCE"
			FROM "SYSTEM"."TWITTER_STREAM_RESULT" 
			WHERE TO_TIMESTAMP(CONCAT(TO_VARCHAR(DATE), TO_VARCHAR(TIME)), 'YYYY-MM-DDHH24:MI:SS') 
			BETWEEN 
				(SELECT START_TIME FROM "SYSTEM"."CAMPAIGNS" WHERE ID = ${campaignId})
			AND 
				(SELECT END_TIME FROM "SYSTEM"."CAMPAIGNS" WHERE ID = ${campaignId})
		UNION ALL
		SELECT
			COUNT(*) AS "COUNT", 'VK' AS "SOURCE"
			FROM "SYSTEM"."VK_STREAM_RESULT" 
			WHERE TO_TIMESTAMP(CONCAT(TO_VARCHAR(DATE), TO_VARCHAR(TIME)), 'YYYY-MM-DDHH24:MI:SS') 
			BETWEEN
				(SELECT START_TIME FROM "SYSTEM"."CAMPAIGNS" WHERE ID = ${campaignId})
			AND 
				(SELECT END_TIME FROM "SYSTEM"."CAMPAIGNS" WHERE ID = ${campaignId})
	`)
	.then(sources => sources.map(toCamelCase))
	.then(sources => {
		sources.push({
			count: sources.reduce((acc, cur) => acc + cur.count, 0), 
			source: "total"
		});
		return sources;
	});
