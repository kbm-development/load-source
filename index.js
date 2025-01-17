var vm = require('vm');
var fs = require('fs');

var isJs =  file => (require('path').extname(file) === '.js');
var isDir = dirPath => fs.statSync(dirPath).isDirectory();
var readDir = (dirPath) => fs.readdirSync(dirPath);

var getCodeBlocks = (markdown) =>  Array.from(markdown.matchAll(/\`\`\`(\w+)((?:\s+\w+=[\w./-]+)*)\s*([\s\S]*?)\`\`\`/g), match => {
  return Object.assign({ lang: match[1], content: match[3].trim()}, match[2].trim().split(/\s+/).reduce((acc, attr)=>{
    let [key, value] = attr.split('=');
    return (key && value) ? (acc[key] = value, acc) : acc;
  }, {}));
});

var evaluate = (code, context) => {
  try{
    if(!context) context = vm.createContext(global);
    let value =  vm.runInContext(code, context);
    return value;
  }catch(err){
    console.log('error: ',err);
    return null;
  }
};

var loadCodeSource = (source) => {
  var code = source.map(code => getCodeBlocks(fs.readFileSync(code).toString()).filter(block=> block.eval === '1').reduce((acc, value)=> acc.concat(`\n${value.content}\n`), []).join('\n')).join('\n').trim();
  return code; 
};

var loadCodeJs = (source, context) => {
  if(!isDir(source)) return fs.readFileSync(source).toString();
  let dir = readDir(source).filter(isJs) || [];
  let code = dir.map(file => fs.readFileSync(`${source}/${file}`).toString()).join('\n');
  return code;
};

module.exports = { loadCodeJs, loadCodeSource, evaluate, getCodeBlocks }
