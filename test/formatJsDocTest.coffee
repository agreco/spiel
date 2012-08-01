path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()
assert = chai.assert

describe 'formatJsDocTest', ->

  expectedFormattedJsDoc = """
  <div class="api_snippet">
  <div class="jsdoc">
  <h1>Sample Class</h1>
  <strong>@class</strong> 
  <strong>@param</strong> String name The name of the class 
  <strong>@param</strong> Number x The number of the class 
  <strong>@author</strong> 
  <strong>@constructor</strong>
  </div>
  <pre class="prettyprint source-code">
  <code>
  function Sample(name, x){
    this.name = name;
    this.number = x;
  }
  </code>
  </pre>
  </div>
  <div class="api_snippet">
  <div class="jsdoc">
  <h1>getName</h1>
  <strong>@function</strong> 
  <strong>@public</strong> 
  <strong>@return</strong> String name The name of the class
  </div>
  <pre class="prettyprint source-code">
  <code>
  Sample.prototype.getName = function(){
    return this.name;
  };
  </code>
  </pre>
  </div>
  <div class="api_snippet">
  <div class="jsdoc">
  <h1>setName</h1>
  <strong>@function</strong> 
  <strong>@public</strong> 
  <strong>@param</strong> String name The name of the class which to set to 
  <strong>@return</strong> String name The amended name of the class
  </div>
  <pre class="prettyprint source-code">
  <code>
  Sample.prototype.setName = function(name){
    return this.name = name;
  };
  </code>
  </pre>
  </div>
  <div class="api_snippet">
  <div class="jsdoc">
  <h1>squareNumber</h1>
  <strong>@function</strong> 
  <strong>@private</strong> 
  <strong>@return</strong> Number number The squared number of the class
  </div>
  <pre class="prettyprint source-code">
  <code>
  Sample.prototype.squareNumber = function(){
    return this.number * this.number;
  };
  </code>
  </pre>
  </div>

  """

  it 'should throw when the argument is missing', ->
    expect(-> helpers.formatJsDoc()).to.throw('helpers.formatJsDoc -> Missing argument [source]')

  it 'should return a string of html formatted JsDoc comments', ->
    formattedJsDoc = ''
    files = helpers.buildFileObjects helpers.cleanseFiles helpers.getFiles './test/resources'
    
    for file in files
      if file.src?
        for src in file.src
          if src.code? and src.tags?
            src.code = helpers.formatJsDoc(src)
            formattedJsDoc += src.code

    expect(expectedFormattedJsDoc).to.equal(formattedJsDoc)

