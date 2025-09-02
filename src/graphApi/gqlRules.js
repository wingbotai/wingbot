/* eslint-disable global-require */
/**
 * @author David Menger
 */
'use strict';

/** @typedef {import('graphql').ValidationRule} ValidationRule */

/**
 * @typedef {object} Logger
 * @prop {Function} log
 * @prop {Function} error
 */

/**
 *
 * @param {object} variables
 * @param {boolean} isProduction
 * @param {boolean} hideVerboseErrors
 * @param {Logger} [log=console]
 * @returns {ValidationRule[]}
 */
function gqlRules (variables, isProduction, hideVerboseErrors, log = console) {
    // OPTIMIZATION FOR LAMBDA PERFORMANCE
    const { GraphQLError, NoSchemaIntrospectionCustomRule } = require('graphql');
    const { createComplexityRule, simpleEstimator } = require('graphql-query-complexity');
    const depthLimit = require('graphql-depth-limit');

    return [
        ...(hideVerboseErrors ? [NoSchemaIntrospectionCustomRule] : []),
        depthLimit(10),
        createComplexityRule({
            // The maximum allowed query complexity, queries above this threshold will be rejected
            maximumComplexity: 1000,

            // The query variables. This is needed because the variables are not available
            // in the visitor of the graphql-js library
            variables,

            // The context object for the request (optional)
            context: {},

            // The maximum number of query nodes to evaluate (fields, fragments, composite types).
            // If a query contains more than the specified number of nodes, the complexity rule will
            // throw an error, regardless of the complexity of the query.
            //
            // Default: 10_000
            maxQueryNodes: 10000,

            // Optional callback function to retrieve the determined query complexity
            // Will be invoked whether the query is rejected or not
            // This can be used for logging or to implement rate limiting
            onComplete: (complexity) => {
                if (!isProduction) {
                    log.log('Determined query complexity: ', complexity);
                }
            },

            // Optional function to create a custom error
            createError: (max, actual) => {
                const msg = `GQL Query too complex: ${actual}. Maximum allowed: ${max}`;

                if (hideVerboseErrors) {
                    log.error(msg);
                    return new GraphQLError('');
                }
                log.log(msg);
                return new GraphQLError(`Query is too complex: ${actual}. Maximum allowed complexity: ${max}`);
            },

            // Add any number of estimators. The estimators are invoked in order, the first
            // numeric value that is being returned by an estimator is used as the field complexity.
            // If no estimator returns a value, an exception is raised.
            estimators: [
                // Add more estimators here...

                // This will assign each field a complexity of 1 if no other estimator
                // returned a value.
                simpleEstimator({
                    defaultComplexity: 1
                })
            ]
        })
    ];
}

module.exports = gqlRules;
