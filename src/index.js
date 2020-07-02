const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
const WebSocket = require('ws');

const session = enigma.create({
    schema,
    url: 'ws://localhost:9076/app/engineData',
    createSocket: (url) => new WebSocket(url),
    responseInterceptors: [{
        onFulfilled: function toggleDelta(session, request, response) {

            // check if the request method is getLayout and 
            // if the response is for object with type current-selections-modified
            if (request.method === 'GetLayout' && response.qInfo.qType == 'current-selections-modified') {
                // if the above is valid then "flatten" the response
                return response.qSelectionObject.qSelections.map(function (s) {
                    return s.qSelectedFieldSelectionInfo.map(function (f) {
                        return {
                            field: s.qField,
                            value: f.qName
                        }
                    })
                }).flat()
            }

            // for every other response return the original response 
            return response;
        },
    }],
});

(async function () {
    let global = await session.open()
    let qDoc = await global.openDoc('/data/Executive Dashboard(1).qvf')

    // lets select some values in one field
    let field = await qDoc.getField('Product Sub Group Desc')
    let selectValues = await field.selectValues([
        { qText: 'Ice Cream' },
        { qText: 'Juice' },
        { qText: 'Chips' }
    ])

    // prepare the current selections object
    // with our custom type - current-selections-modified
    let selectionObjectProps = {
        "qInfo": {
            "qId": "",
            "qType": "current-selections-modified"
        },
        "qSelectionObjectDef": {}
    }

    let sessionObj = await qDoc.createSessionObject(selectionObjectProps);
    let sessionObjLayout = await sessionObj.getLayout(); // our interceptor will be invoked here

    console.log(sessionObjLayout)
})()