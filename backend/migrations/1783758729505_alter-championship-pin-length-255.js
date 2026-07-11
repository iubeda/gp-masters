exports.up = (pgm) => {
    pgm.alterColumn('championships', 'pin', {
        type: 'varchar(255)'
    });
};

exports.down = (pgm) => {
    pgm.alterColumn('championships', 'pin', {
        type: 'varchar(60)'
    });
};
