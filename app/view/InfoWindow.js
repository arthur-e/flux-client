Ext.define('Flux.view.InfoWindow', {
    extend: 'Ext.Window',
    alias: 'widget.infowindow',
    layout: 'fit',
    bodyPadding: 0,
    resizable: false,

    defaults: {
        bodyStyle: 'textAlign:justify;'
    },

    items: {
        xtype: 'tabpanel',
        layout: 'fit',
        defaults: {
            autoScroll: true,
            bodyPadding: 10
        },
        activeTab: 0,
        items: [
            {
                title: 'About',
                html: [
                    'Welcome to the <b>Carbon Data Explorer</b>,',
                    'a web-based visualization tool for multi-dimensional geospatial gridded datasets.',
                    '</br>',
                    '</br>',
                    '<a href=https://vimeo.com/129796671>Demo video</a>',
                    '</br>',
                    "<a href=https://docs.google.com/document/d/17qttP61aVsBPAS6tj6H0_VVkgTV2XQ6WuAb_PMyVoaM>User's guide</a>",
                    '</br>',
                    '</br>',
                    '<b>Git</b>: <a href=https://github.com/MichiganTechResearchInstitute/CarbonDataExplorer>https://github.com/MichiganTechResearchInstitute/CarbonDataExplorer</a>',
                    '</br>',
                    '</br>',
                    '<table width="100%"><tr>',
                    '<td><a href="http://mtri.org"><img src="/flux-client/resources/MTRI_logo_dark_bg.png" width=120 /></a></td>',
                    '<td><a href="http://dge.stanford.edu/"><img src="/flux-client/resources/CIS_logo.png" width=120 /></a></td>',
                    '<td><a href="http://www.nasa.gov"><img src="/flux-client/resources/NASA_logo.png" width=88 /></a></td>',
                    '<td><a href="http://nsf.gov"><img src="/flux-client/resources/NSF_logo.jpg" width=88 /></a></td>',
                    '</tr></table>',
                    '<div class="attribution">Developed by MTRI in partnership with the Carnegie Institution for Science under NASA ROSES Grant #NNH09ZDA001N</div>'
                      ].join('\n')
            }, {
                title: 'Contact Info',
                html: '<b>K. Arthur Endsley, GST</b><br />PhD Graduate Student, Research Scientist<br /><a href="mailto:kaendsle@mtu.edu">kaendsle@mtu.edu</a><br /><br /><b>Michael Billmire, CMS-GIS/LIS</b><br />Research Scientist, Webmaster<br /><a href="mailto:mgbillmi@mtu.edu">mgbillmi@mtu.edu</a><br />'
            }
        ]
    },

    listeners: {
        beforerender: function () {
            var toolbar = this.addDocked({
                xtype: 'toolbar',
                dock: 'bottom'
            }).pop();

            if (Ext.supports.LocalStorage) {
                toolbar.add([{
                        xtype: 'checkbox',
                        boxLabel: '<span style="font-size: 11px;color: #555;">' + "Don't show this at start-up" + '</span>',
                        toggleHiddenProperty: 'neverShowInfoWindow'
                    }
                ]);
           }

        },

        show: function () {
            var b, c;

            c = this.down('toolbar checkbox');

            if (c !== undefined) {
                this.down('toolbar checkbox').setValue(function () {
                    var r = Ext.StoreManager.get(
                                'UserPreferences').query('property',
                                                         c.toggleHiddenProperty
                                                        ).first();
                    return (r === undefined) ? false : r.get('value');
                }());
            }

        }
    }

});

