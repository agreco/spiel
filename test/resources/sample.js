/**
 * Sample Class
 * ============
 *
 * This is a sample class demonstrating the mix of
 * Markdown and JSDoc within code comments
 *
 * @class Represents a Sample class
 * @param {String} name The name of the class
 * @param {Number} x The number of the class
 * @author Antonio G. Greco
 * @constructor
 */
function Sample(name, x){
  this.name = name;
  this.number = x;
}

/**
 * getName
 * =======
 *
 * Returns the name of the class
 *
 * @function
 * @public
 * @return {String} name The name of the class
 */
Sample.prototype.getName = function(){
  return this.name;
};

/**
 * setName
 * =======
 *
 * Sets the name of the class
 *
 * @function
 * @public
 * @param {String} name The name of the class which to set to
 * @return {String} name The amended name of the class
 */
Sample.prototype.setName = function(name){
  return this.name = name;
};

/**
 * squareNumber
 * ============
 *
 * Squares the number of the class, this is used internally
 *
 * @function
 * @private
 * @return {Number} number The squared number of the class
 */
Sample.prototype.squareNumber = function(){
  return this.number * this.number;
};