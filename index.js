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

var evaluate = (code) => {
  try{
    var context = vm.createContext(global);
    let value =  vm.runInContext(code, Object.assign(context, { console, module, require, process, __dirname: process.cwd() }));
    return value;
  }catch(err){
    console.log('error: ',err);
    return value;
  }
};

var loadCodeSource = (source) => {
  var code = source.map(code => getCodeBlocks(fs.readFileSync(code).toString()).filter(block=> block.eval === '1').reduce((acc, value)=> acc.concat(`\n${value.content}\n`), []).join('\n')).join('\n').trim();
  return evaluate(code);
};

var loadCodeJs = (source) => {
  if(!isDir(source)) return evaluate(fs.readFileSync(source).toString());
  let dir = readDir(source).filter(isJs) || [];
  let code = dir.map(file => fs.readFileSync(`${source}/${file}`).toString()).join('\n');
  return evaluate(code);
};

module.exports = { getCodeBlocks, evaluate, loadCodeSource, loadCodeJs };
