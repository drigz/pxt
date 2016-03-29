///<reference path='blockly.d.ts'/>
///<reference path='touchdevelop.d.ts'/>
/// <reference path="../built/kindlib.d.ts" />

namespace ks.blocks {
    export function importXml(info: ts.ks.BlocksInfo, xml: string) : string {
        try {
            let parser = new DOMParser();
            let doc = parser.parseFromString(xml, "application/xml");
          
            // build upgrade map
            let enums : U.Map<string> = {};
            for(let k in info.apis.byQName) {
                let api = info.apis.byQName[k];
                if (api.kind == ts.ks.SymbolKind.EnumMember)
                    enums[api.namespace + '.' + (api.attributes.blockImportId || api.name)] = api.namespace + '.' + api.name;
            }
          
            // walk through blocks and patch enums
            let blocks = doc.getElementsByTagName("block");   
            for(let i = 0; i < blocks.length; ++i)
                patchBlock(info, enums, blocks[i]);
            
            // serialize and return
            return new XMLSerializer().serializeToString(doc);            
        }
        catch(e) {
            reportException(e, xml);
            return xml;
        }        
    }
    
    function patchBlock(info: ts.ks.BlocksInfo, enums: U.Map<string>, block : Element) : void {
        let type = block.getAttribute("type");
        let b = Blockly.Blocks[type];
        let symbol = blockSymbol(type);
        if (!symbol || !b) return;
        
        let params = parameterNames(symbol);
        symbol.parameters.forEach((p, i) => {
            let ptype = info.apis.byQName[p.type];
            if (ptype && ptype.kind == ts.ks.SymbolKind.Enum) {
                let field = block.querySelector(`field[name=${params[p.name].name}]`);
                if (field) {
                    let en = enums[ptype.name + '.' + field.textContent];
                    if (en) field.textContent = en;
                }
                /*
<block type="device_button_event" x="92" y="77">
    <field name="NAME">Button.AB</field>
  </block>
                  */
            }
        })
    }
}