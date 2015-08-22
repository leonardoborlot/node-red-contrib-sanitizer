module.exports = function(RED) 
{
    "use strict";

    //Below Operators are not required since only Sanitization needs to be done but are kept just for testing purpose.
    var operators = {
        'eq': function(a, b) { return a == b; },
        'neq': function(a, b) { return a != b; },
        'lt': function(a, b) { return a < b; },
        'lte': function(a, b) { return a <= b; },
        'gt': function(a, b) { return a > b; },
        'gte': function(a, b) { return a >= b; },
        'btwn': function(a, b, c) { return a >= b && a <= c; },
        'cont': function(a, b) { return (a + "").indexOf(b) != -1; },
        'regex': function(a, b) { return (a + "").match(new RegExp(b)); },
        'true': function(a) { return a === true; },
        'false': function(a) { return a === false; },
        'null': function(a) { return (typeof a == "undefined" || a === null); },
        'nnull': function(a) { return (typeof a != "undefined" && a !== null); },
    };

    function SanitizerNode(n) 
    {
        RED.nodes.createNode(this, n);
        this.rules = n.rules || [];
        var node = this;

        this.on('input', function (msg) 
        {
            //Just in case the input never went through a JSON parser, Just adding the JSON parser code here

            if (msg.hasOwnProperty("payload")) 
            {
                    
                        if (typeof msg.payload === "string") {
                            try {
                                msg.payload = JSON.parse(msg.payload);
                                //node.send(msg);
                            }
                            catch(e) 
                            { 
                                node.error("Exiting due to the following reason: ");
                                throw "Error Code:1 -> JSON not in right format: " + e ;
                            }
                        }
                        else if (typeof msg.payload === "object") {
                            if ((!Buffer.isBuffer(msg.payload)) && (!util.isArray(msg.payload))) {
                                msg.payload = JSON.stringify(msg.payload);
                                //node.send(msg);
                            }
                            else { node.warn(RED._("json.errors.dropped-object")); }
                        }
                        else { node.warn(RED._("json.errors.dropped")); }     
            }

            // Collecting the name of the properties that were entered by the user over the Web Interface.

            var properties = [] ;
            var operation = [] ;
            var output = [] ;

            for (var i=0; i<node.rules.length; i+=1) 
            {
                properties[i] = node.rules[i].property ;
            }

            // Function to check if all the properties entered by the user actually exists in the message that is being sent as input ( msg.payload )

            function checkIfAsgPropExists( element , index , array )
            {
                if ( Object.keys(msg.payload).indexOf(element) == -1 )
                {
                    node.error("Exiting due to the following reason: ");
                    throw "Error Code:2 -> The Property: " + element  + " does not exist in the msg.payload";
                }
            }

            // Function to check if the value is a number

            function checkIfNumber( elementToBeChecked )
            {
                try
                {
                    
                    if (  typeof ( parseInt(elementToBeChecked) ) === "number" &&  ! isNaN( parseInt(elementToBeChecked) )  ) 
                    { 
                        return ( typeof ( parseInt(elementToBeChecked) ) )
                    }
                    else
                    {
                        return "notNumber"
                    } 
                    //node.warn("test:" + parseInt(elementToBeChecked))
                }
                catch ( parseError )
                {
                    //node.error("Exiting due to the following reason: ");
                    throw "Error Code:5 -> Failed to parse : " + typeof( elementToBeChecked ) + " to number" ; 
                    return "notNumber"
                }
            }

            //Invoking the checkIfAsgPropExists function for each element in the array of properties collected over the Web Interface from the User.
            properties.forEach( checkIfAsgPropExists )

            // Checking the rules and validating the input entered by the user as well the input from the message 

            for (var i=0; i<node.rules.length; i+=1) 
            {
                properties[i] = node.rules[i].property ;
                operation[i] = node.rules[i].t;
                if (!(operation[i] === "true" || operation[i] === "false" || operation[i] === "null" || operation[i] === "nnull" ))
                {
                    if ( operation[i] == "btwn" )
                    {

                        if (  checkIfNumber( msg.payload[ properties[i]] ) === "number" && checkIfNumber(node.rules[i].v)  === "number" && checkIfNumber(node.rules[i].v2) === "number" )
                        {
                            output[i] =  operators[ operation[i] ] ( msg.payload[ properties[i] ] , node.rules[i].v  , node.rules[i].v2 )
                        }
                        else
                        {
                            node.error("Exiting due to the following reason: ");
                            throw "Error Code:3 -> Expected Number, got a different type of content other than number\n" + " Operation: " + operation[i]  + "Message : " + typeof(msg.payload[ properties[i] ] ) + "\nValue 1: " + typeof(node.rules[i].v) + "\nValue 2: "  + typeof(node.rules[i].v2) ;
                        }
                        
                    }
                    else if ( operation[i] == "lt" || operation[i] == "lte" || operation[i] == "gt" || operation[i] == "gte" )
                    {
                        if ( checkIfNumber(msg.payload[ properties[i] ])  === "number" && checkIfNumber(node.rules[i].v)  === "number"  )
                        {
                            output[i] =  operators[ operation[i] ] (   msg.payload[ properties[i] ] , node.rules[i].v  )
                        }
                        else
                        {
                            node.error("Exiting due to the following reason: ");
                            throw "Error Code:3 -> Expected Number, got a different type of content other than number\n" + " Operation: " + operation[i] + " Message : " + typeof(msg.payload[ properties[i] ] ) + "\nValue : " + typeof(node.rules[i].v)  ;
                        }

                    }
                    else 
                    {
                        output[i] =  operators[ operation[i] ] ( node.rules[i].v  , msg.payload[ properties[i] ] )
                    }       
                }
                else
                {
                    if ( operation[i] === "true" || operation[i] === "false"  )
                    {
                        if ( typeof(msg.payload[ properties[i] ]) === "boolean" )
                        {
                            output[i] =  operators[ operation[i] ] ( msg.payload[ properties[i] ] )
                        }
                        else
                        {
                            node.error("Exiting due to the following reason: ");
                            throw "Error Code:4-> Expected Boolean, got a different type of content other than boolean: " + " Operation: " + operation[i] + typeof(msg.payload[ properties[i] ]) ;
                        }
                    }
                    else
                    {
                        output[i] =  operators[ operation[i] ] ( msg.payload[ properties[i] ] )
                    }
                    
                }

            }

            //Actual output of the various operations in the same order they are entered. 
            //Below code is used just for testing. It can be ignored when only sanitization is required.
            for (var i=0; i<node.rules.length; i+=1) 
            {
                if ( operation[i] == "btwn" )
                {
                    node.send( "Operation: " + operation[i] + " Message value: " + msg.payload[ properties[i] ] + " User selected value1: " + node.rules[i].v + " User selected value1: " + node.rules[i].v2 + " Output: " + output[i] )
                }
                else if (!(operation[i] === "true" || operation[i] === "false" || operation[i] === "null" || operation[i] === "nnull" ))
                {
                    node.send( "Operation: " + operation[i] + " Message value: " + msg.payload[ properties[i] ] + " User selected value: " + node.rules[i].v + " Output: " + output[i] )
                }
                else
                {
                    node.send( "Operation: " + operation[i] + " Message value: " + msg.payload[ properties[i] ] + " Output: " + output[i] );
                }
                
            }

        });
    }
    RED.nodes.registerType("sanitizer", SanitizerNode);
}
