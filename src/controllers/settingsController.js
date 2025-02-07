const Settings = require('../models/Setting');

// WebSocket Management
const handleSettingsChange = (io) => {
    const changeStream = Settings.watch();

    changeStream.on('change', (change) => {
        if (['insert', 'update', 'replace'].includes(change.operationType)) {
            io.emit("settingsUpdate", change.fullDocument);
        }
    });
};

module.exports = { handleSettingsChange };
