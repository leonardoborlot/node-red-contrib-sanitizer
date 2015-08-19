module.exports = function(RED) {
    "use strict";
    var util = require("util");



    // The main node definition - most things happen in here
    function SanitizerNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        this.optionSelected = n.optionSelected

        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;

        var msg = {};
        msg.topic = this.topic;
        //msg.payload = "Hello world !";

        // send out the message to the rest of the workspace.
        // ... this message will get sent at startup so you may not see it in a debug node.
        //this.send(msg);

        // respond to inputs....
        this.on('input', function (msg) {
            //node.warn("I saw a payload: "+msg.payload);
            // in this example just send it straight on... should process it here really
            try 
            {
                
                if (msg.hasOwnProperty("payload")) 
                {
                    if (typeof msg.payload === "string") {
                        try {
                            msg.payload = JSON.parse(msg.payload);
                            //node.send(msg);
                        }
                        catch(e) { node.error(e.message,msg); }
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



                
                if ( this.optionSelected == "firstName" )
                {
                    node.send(msg.payload.firstName)
                    //node.warn(msg.payload.firstName)
                }
                else if ( this.optionSelected == "middleName"  )
                {
                    node.send(msg.payload.middleName)
                    //node.warn(msg.payload.middleName)
                }
                else if ( this.optionSelected == "lastName"  )
                {
                    node.send(msg.payload.lastName)
                    //node.warn(msg.payload.lastName)
                }
                else if ( this.optionSelected == "fullName" )
                {
                    node.send( msg.payload.firstName + " " + msg.payload.middleName + " " + msg.payload.lastName )
                    //node.warn( msg.payload.firstName + " " + msg.payload.middleName + " " + msg.payload.lastName )
                }
                //node.warn(this.optionSelected)
                //node.send(msg);
                
            }
            catch(err) {
                node.warn(err);
            }

        });

        this.on("close", function() {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("sanitizer",SanitizerNode);

}
