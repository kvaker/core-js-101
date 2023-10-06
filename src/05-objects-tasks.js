/* ************************************************************************************************
 *                                                                                                *
 * Please read the following tutorial before implementing tasks:                                   *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object        *
 *                                                                                                *
 ************************************************************************************************ */

/**
 * Returns the rectangle object with width and height parameters and getArea() method
 *
 * @param {number} width
 * @param {number} height
 * @return {Object}
 *
 * @example
 *    const r = new Rectangle(10,20);
 *    console.log(r.width);       // => 10
 *    console.log(r.height);      // => 20
 *    console.log(r.getArea());   // => 200
 */
function Rectangle(width, height) {
  return {
    width,
    height,
    getArea: () => width * height,
  };
}

/**
 * Returns the JSON representation of specified object
 *
 * @param {object} obj
 * @return {string}
 *
 * @example
 *    [1,2,3]   =>  '[1,2,3]'
 *    { width: 10, height : 20 } => '{"height":10,"width":20}'
 */
function getJSON(obj) {
  return JSON.stringify(obj);
}

/**
 * Returns the object of specified type from JSON representation
 *
 * @param {Object} proto
 * @param {string} json
 * @return {object}
 *
 * @example
 *    const r = fromJSON(Circle.prototype, '{"radius":10}');
 *
 */
function fromJSON(proto, json) {
  const obj = JSON.parse(json);

  Object.setPrototypeOf(obj, proto);

  return obj;
}

/**
 * Css selectors builder
 *
 * Each complex selector can consists of type, id, class, attribute, pseudo-class
 * and pseudo-element selectors:
 *
 *    element#id.class[attr]:pseudoClass::pseudoElement
 *              \----/\----/\----------/
 *              Can be several occurrences
 *
 * All types of selectors can be combined using the combination ' ','+','~','>' .
 *
 * The task is to design a single class, independent classes or classes hierarchy
 * and implement the functionality to build the css selectors using the provided cssSelectorBuilder.
 * Each selector should have the stringify() method to output the string representation
 * according to css specification.
 *
 * Provided cssSelectorBuilder should be used as facade only to create your own classes,
 * for example the first method of cssSelectorBuilder can be like this:
 *   element: function(value) {
 *       return new MySuperBaseElementSelector(...)...
 *   },
 *
 * The design of class(es) is totally up to you, but try to make it as simple,
 * clear and readable as possible.
 *
 * @example
 *
 *  const builder = cssSelectorBuilder;
 *
 *  builder.id('main').class('container').class('editable').stringify()
 *    => '#main.container.editable'
 *
 *  builder.element('a').attr('href$=".png"').pseudoClass('focus').stringify()
 *    => 'a[href$=".png"]:focus'
 *
 *  builder.combine(
 *      builder.element('div').id('main').class('container').class('draggable'),
 *      '+',
 *      builder.combine(
 *          builder.element('table').id('data'),
 *          '~',
 *           builder.combine(
 *               builder.element('tr').pseudoClass('nth-of-type(even)'),
 *               ' ',
 *               builder.element('td').pseudoClass('nth-of-type(even)')
 *           )
 *      )
 *  ).stringify()
 *    => 'div#main.container.draggable + table#data ~ tr:nth-of-type(even)   td:nth-of-type(even)'
 *
 *  For more examples see unit tests.
 */

class CssSelectorBuilder {
  constructor(current, ctx) {
    if (!current && !ctx) {
      this.elems = [];
    } else {
      const context = { ...ctx };

      if (!context.created) {
        context.elems = [];
      } else {
        this.checkOneOfType(context.elems, current);
        this.checkOrder(context.elems, current);
      }

      context.elems.push(current);

      context.stringify = ctx.stringify.bind(context);
      context.element = ctx.element.bind(context);
      context.id = ctx.id.bind(context);
      context.class = ctx.class.bind(context);
      context.attr = ctx.attr.bind(context);
      context.pseudoClass = ctx.pseudoClass.bind(context);
      context.pseudoElement = ctx.pseudoElement.bind(context);
      context.combine = ctx.combine.bind(context);
      context.checkOneOfType = ctx.checkOneOfType.bind(context);
      context.checkOrder = ctx.checkOrder.bind(context);
      context.created = true;

      return context;
    }
  }

  checkOneOfType(elems, current) {
    this.current = current;
    const oneType = current.tag === true || current.unit === '::' || current.unit === '#';

    if (oneType) {
      const hasInElems = elems.find((el) => (
        el.tag === current.tag && el.unit === current.unit
      ) || el.unit === current.unit);

      if (hasInElems) {
        throw new Error('Element, id and pseudo-element should not occur more then one time inside the selector');
      }
    }
  }

  checkOrder(elems, current) {
    this.current = current;

    const items = [...elems, current];

    const etalonOrder = [...items]
      .sort((a, b) => a.specific - b.specific)
      .filter((el) => el)
      .map((item) => item.specific);

    const currentOrder = items.map((item) => item.specific);

    if (etalonOrder.join('') !== currentOrder.join('')) {
      throw new Error('Selector parts should be arranged in the following order: element, id, class, attribute, pseudo-class, pseudo-element');
    }
  }

  stringify() {
    const current = [...this.elems];

    this.elems.length = 0;

    return current.map((el) => el.unit + el.value).join('');
  }

  element(el) {
    const obj = {
      value: el,
      unit: '',
      tag: true,
      specific: 0,
    };

    return new CssSelectorBuilder(obj, this);
  }

  id(id) {
    const obj = {
      value: id,
      unit: '#',
      tag: false,
      specific: 1,
    };

    return new CssSelectorBuilder(obj, this);
  }

  class(cl) {
    const obj = {
      value: cl,
      unit: '.',
      tag: false,
      specific: 2,
    };

    return new CssSelectorBuilder(obj, this);
  }

  attr(ar) {
    const obj = {
      value: `[${ar}]`,
      unit: '',
      tag: false,
      specific: 3,
    };

    return new CssSelectorBuilder(obj, this);
  }

  pseudoClass(pseudoCl) {
    const obj = {
      value: pseudoCl,
      unit: ':',
      tag: false,
      specific: 4,
    };

    return new CssSelectorBuilder(obj, this);
  }

  pseudoElement(pseudoEl) {
    const obj = {
      value: pseudoEl,
      unit: '::',
      tag: false,
      specific: 5,
    };

    return new CssSelectorBuilder(obj, this);
  }

  combine(...args) {
    this.args = args;

    return {
      data: args.map((item) => {
        if (typeof item === 'string') return ` ${item} `;

        if (typeof item === 'object' && item.stringify) return item.stringify();

        return item;
      }),
      stringify() {
        return this.data.flat().join('');
      },
    };
  }
}

const cssSelectorBuilder = new CssSelectorBuilder();

module.exports = {
  Rectangle,
  getJSON,
  fromJSON,
  cssSelectorBuilder,
};
