import type {Component} from '../component';
import {Property, PropertyOptions, IntrospectedProperty} from './property';

export type IntrospectedMethod = IntrospectedProperty;

export type MethodOptions = PropertyOptions;

/**
 * *Inherits from [`Property`](https://layrjs.com/docs/v1/reference/property).*
 *
 * A `Method` represents a method of a [Component](https://layrjs.com/docs/v1/reference/component) class, prototype, or instance. It plays the role of a regular JavaScript method, but brings the ability to be exposed to remote calls.
 *
 * #### Usage
 *
 * Typically, you define a `Method` using the [`@method()`](https://layrjs.com/docs/v1/reference/component#method-decorator) decorator.
 *
 * For example, here is how you would define a `Movie` class with some methods:
 *
 * ```
 * import {Component, method} from '﹫layr/component';
 *
 * class Movie extends Component {
 *   // Class method
 *   ﹫method() static getConfig() {
 *     // ...
 *   }
 *
 *   // Instance method
 *   ﹫method() play() {
 *     // ...
 *   }
 * }
 * ```
 *
 * Then you can call a method like you would normally do with regular JavaScript:
 *
 * ```
 * Movie.getConfig();
 *
 * const movie = new Movie({title: 'Inception'});
 * movie.play();
 * ```
 *
 * So far, you may wonder what is the point of defining methods this way. By itself the [`@method()`](https://layrjs.com/docs/v1/reference/component#method-decorator) decorator, except for creating a `Method` instance under the hood, doesn't provide much benefit.
 *
 * The trick is that since you have a `Method`, you also have a [`Property`](https://layrjs.com/docs/v1/reference/property) (because `Method` inherits from `Property`), and properties can be exposed to remote access thanks to the [`@expose()`](https://layrjs.com/docs/v1/reference/component#expose-decorator) decorator.
 *
 * So here is how you would expose the `Movie` methods:
 *
 * ```
 * import {Component, method} from '﹫layr/component';
 *
 * class Movie extends Component {
 *   // Exposed class method
 *   ﹫expose({call: true}) ﹫method() static getConfig() {
 *     // ...
 *   }
 *
 *   // Exposed instance method
 *   ﹫expose({call: true}) ﹫method() play() {
 *     // ...
 *   }
 * }
 * ```
 *
 * Now that you have some exposed methods, you can call them remotely in the same way you would do locally:
 *
 * ```
 * Movie.getConfig(); // Executed remotely
 *
 * const movie = new Movie({title: 'Inception'});
 * movie.play();  // Executed remotely
 * ```
 */
export class Method extends Property {
  _methodBrand!: void;

  /**
   * Creates an instance of [`Method`](https://layrjs.com/docs/v1/reference/method). Typically, instead of using this constructor, you would rather use the [`@method()`](https://layrjs.com/docs/v1/reference/component#method-decorator) decorator.
   *
   * @param name The name of the method.
   * @param parent The component class, prototype, or instance that owns the method.
   * @param [options.exposure] A [`PropertyExposure`](https://layrjs.com/docs/v1/reference/property#property-exposure-type) object specifying how the method should be exposed to remote calls.
   *
   * @returns The [`Method`](https://layrjs.com/docs/v1/reference/method) instance that was created.
   *
   * @example
   * ```
   * import {Component, Method} from '﹫layr/component';
   *
   * class Movie extends Component {}
   *
   * const play = new Method('play', Movie.prototype, {exposure: {call: true}});
   *
   * play.getName(); // => 'play'
   * play.getParent(); // => Movie.prototype
   * play.getExposure(); // => {call: true}
   * ```
   *
   * @category Creation
   */
  constructor(name: string, parent: typeof Component | Component, options: MethodOptions = {}) {
    super(name, parent, options);
  }

  // === Methods ===

  /**
   * See the methods that are inherited from the [`Property`](https://layrjs.com/docs/v1/reference/property#basic-methods) class.
   *
   * @category Methods
   */

  // === Utilities ===

  static isMethod(value: any): value is Method {
    return isMethodInstance(value);
  }

  describeType() {
    return 'method';
  }
}

/**
 * Returns whether the specified value is a `Method` class.
 *
 * @param value A value of any type.
 *
 * @returns A boolean.
 *
 * @category Utilities
 */
export function isMethodClass(value: any): value is typeof Method {
  return typeof value?.isMethod === 'function';
}

/**
 * Returns whether the specified value is a `Method` instance.
 *
 * @param value A value of any type.
 *
 * @returns A boolean.
 *
 * @category Utilities
 */
export function isMethodInstance(value: any): value is Method {
  return isMethodClass(value?.constructor) === true;
}
