/* eslint-disable no-plusplus */
/* eslint-disable no-self-compare */
/* eslint-disable prefer-rest-params */
/* eslint-disable radix */
/* eslint-disable no-extend-native */
/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
/* eslint-disable prefer-object-spread */
/* eslint-disable prefer-template */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable object-shorthand */

window.msiGlobalTagging = {
	uetElementsArray: ['A', 'BUTTON'],
	uetFormElementsArray: ['INPUT', 'TEXTAREA', 'SELECT', 'OPTIONS'],
	uetInputTypeArray: ['checkbox', 'radio'],
	getElementTagName: function (element) {
		return element.dataset.uetElement
			? element.dataset.uetElement.toUpperCase()
			: element.tagName;
	},
	getEventTarget: function (event) {
		return event.composed ? event.composedPath()[0] : event.target;
	},
	getParentElement: function (element) {
		if (element.parentElement) {
			return element.parentElement;
		}
		return element.getRootNode().host;
	},
	dataToCamelCase: function (string) {
		return string.replace(/^data-/g, '').replace(/-([a-z])/g, function (el) {
			return el[1].toUpperCase();
		});
	},
	findClosest: function (element, dataAttr, byDefault) {
		let ret = element.dataset[this.dataToCamelCase(dataAttr)];
		if (ret) {
			return ret;
		}
		ret = element.closest('[' + dataAttr + ']');
		return (ret && ret.dataset[this.dataToCamelCase(dataAttr)]) || byDefault;
	},
	removeEmptyAndLowerCase: function (obj) {
		const self = this;
		return Object.keys(obj)
			.filter(function (k) {
				return obj[k] != null;
			})
			.reduce(function (acc, k) {
				if (typeof obj[k] === 'object') {
					acc[k] = self.removeEmptyAndLowerCase(obj[k]);
				} else {
					acc[k] = k === 'link-url' ? obj[k] : obj[k].toLowerCase();
				}
				return acc;
			}, {});
	},
	disableElement: function (element) {
		// eslint-disable-next-line no-param-reassign
		element.dataset.uetOff = true;
	},
	tealiumEcommDetail: function (element, dataUet) {
		const eventName = this.findClosest(element, 'data-ecomm-event-name', null);
		if (!eventName) {
			return null;
		}
		return {
			// event-name: ['add', 'remove', 'product_click', 'place_order']
			'event-name': eventName,
			'product-id': this.findClosest(element, 'data-ecomm-product-id', null),
			'product-name': this.findClosest(element, 'data-ecomm-product-name', null),
			'product-brand': this.findClosest(element, 'data-ecomm-product-brand', null),
			'product-category': this.findClosest(element, 'data-ecomm-product-category', null),
			'product-sale-price': this.findClosest(element, 'data-ecomm-product-sale-price', null),
			'product-quantity': this.findClosest(element, 'data-ecomm-product-quantity', null),
			'product-discount': this.findClosest(element, 'data-ecomm-product-discount', null),
			'product-list-price': this.findClosest(element, 'data-ecomm-product-list-price', null),
			'product-variant': this.findClosest(element, 'data-ecomm-product-variant', null),
			'product-position': this.findClosest(
				element,
				'data-ecomm-product-position',
				dataUet['link-place'],
			),
			// Checkout part, even-name = 'place_order'
			'product-coupon-code': this.findClosest(
				element,
				'data-ecomm-product-coupon-code',
				null,
			),
			'checkout-step': this.findClosest(element, 'data-ecomm-checkout-step', null),
			'payment-type': this.findClosest(element, 'data-ecomm-payment-type', null),
			'shipping-method': this.findClosest(element, 'data-ecomm-shipping-method', null),
			'shipping-coupon-code': this.findClosest(
				element,
				'data-ecomm-shipping-coupon-code',
				null,
			),
			'shipping-discount': this.findClosest(element, 'data-ecomm-shipping-discount', null),
			'shipping-total': this.findClosest(element, 'data-ecomm-shipping-total', null),
			'order-coupon-code': this.findClosest(element, 'data-ecomm-order-coupon-code', null),
			'order-subtotal': this.findClosest(element, 'data-ecomm-order-subtotal', null),
			'order-tax': this.findClosest(element, 'data-ecomm-order-tax', null),
			'order-total': this.findClosest(element, 'data-ecomm-order-total', null),
			'order-discount': this.findClosest(element, 'data-ecomm-order-discount', null),
		};
	},
	tealiumEventDetail: function (element, root, customActionName) {
		if (element.dataset.uetOff !== undefined) {
			return false;
		}
		const urlRoot = document.location.protocol + '//' + document.location.host;
		const elementTagName = this.getElementTagName(element);
		const elementValue = element.value ? element.value.trim() : null;
		let linkType = null;
		let linkUrl = null;
		let action = null;

		const addDetails = [];
		if (element.dataset.uetAddDetails) {
			addDetails.push(element.dataset.uetAddDetails);
		}
		if (element.dataset.uetAddDetailsLabel) {
			// Example add-details case: Label + Value
			// total featured items: ${total number of featured items}
			addDetails.push(
				element.dataset.uetAddDetailsLabel + ': ' + element.dataset.uetAddDetailsValue,
			);
		}

		const cname = this.findInParents(element, root, 'data-uet-cname') || 'no-cname';
		const linkHierarchy = this.findInParents(element, root, 'data-uet-link-hierarchy');

		const linkLabelPrefix = this.findClosest(element, 'data-uet-link-label-prefix', null);
		const restriction = this.findClosest(element, 'data-uet-restriction', 'public');
		const widgetPosition = this.findClosest(element, 'data-uet-widget-position', null);
		const pageArea = this.findClosest(element, 'data-uet-page-area', '2');

		const linkPlace = element.dataset.uetLinkPlace || '1';

		const linkLabelPure =
			element.dataset.uetLinkLabel ||
			element.textContent.replace(/^\s+/, '').replace(/\s+$/, '');
		let linkLabel = linkLabelPrefix ? linkLabelPrefix + ': ' + linkLabelPure : linkLabelPure;

		switch (elementTagName) {
			case 'INPUT':
			case 'TEXTAREA':
				if (element.type === 'checkbox') {
					// except for Input-checkbox
					action = 'click';
					linkType = 'checkbox ' + (element.checked ? 'checked' : 'unchecked');
					linkUrl = '@check ' + linkLabelPure;
					this.disableElement(element);
					break;
				} else if (element.type === 'radio') {
					// except for Input-radio
					action = 'click';
					linkType = 'button';
					linkUrl = '@select ' + linkLabelPure;
					this.disableElement(element);
					break;
				}
				if (!elementValue) {
					// Fire only when input field value (after trimming) is NOT an empty string!
					return false;
				}
				action = 'focusout';
				linkType = 'field value populated';
				linkUrl =
					'@enter ' +
					(element.getAttribute('name') || element.getAttribute('id') || linkLabelPure);
				if (element.className.includes('search')) {
					action = customActionName || 'focusout';
					linkType = 'perform search';
					linkUrl = '@perform search';
					addDetails.push('search term: ' + elementValue);
				} else {
					// Disable all Inputs elements beside Search fields
					this.disableElement(element);
				}
				break;
			case 'SELECT':
			case 'OPTIONS':
				break;
			case 'A':
			case 'BUTTON':
			default:
				action = 'click';
				linkUrl =
					element.dataset.uetLinkUrl ||
					(elementTagName === this.uetElementsArray[0]
						? element.href
						: '@' + linkLabelPure);
				linkType =
					element.dataset.uetLinkType ||
					(elementTagName === this.uetElementsArray[0] ? 'link' : 'button');
				// Rule for custom add-details in search case
				if (element.dataset.uetAddDetailsSearch) {
					const relative = document.querySelector(
						'#' + element.dataset.uetAddDetailsSearch,
					);
					const relativeValue = relative.value ? relative.value.trim() : null;
					if (!relativeValue) {
						// Fire only when input field value (after trimming) is NOT an empty string!
						return false;
					}
					addDetails.push('search term: ' + relativeValue);
					linkType = 'perform search';
					linkUrl = '@perform search';
				}
				break;
		}

		if (linkHierarchy) {
			addDetails.unshift('link-hierarchy: ' + linkHierarchy);
		}
		// Customise tagging in case drawer trigger
		if (element.dataset.uetDrawerInverseName) {
			if (element.dataset.uetDrawerInversed === 'true') {
				linkLabel = element.dataset.uetDrawerInverseName;
				linkUrl = '@' + element.dataset.uetDrawerInverseName;
			}
			element.dataset.uetDrawerInversed = !element.dataset.uetDrawerInversed;
		}
		// Remove all `null` paramers in Object before triggered Event and LowerCase all String exсept link-url
		return this.removeEmptyAndLowerCase({
			action: action,
			'data-uet': {
				'link-type': linkType,
				'link-label': linkLabel,
				'link-url': linkUrl.startsWith(urlRoot)
					? linkUrl.substr(urlRoot.length)
					: linkUrl.toLowerCase(),
				'link-place': linkPlace,
				restriction: restriction,
				'document-type': element.dataset.uetDocumentType || '',
				'add-detail': addDetails.join(' | '),
				cname: cname,
				'widget-position': widgetPosition,
				'page-area': pageArea,
			},
			'data-ecomm': this.tealiumEcommDetail(element, { 'link-place': linkPlace }),
		});
	},
	callEvent: function (root, data) {
		window.document.dispatchEvent(
			new CustomEvent(root.dataset.uetEvent || 'uetevent', {
				bubbles: true,
				detail: data,
			}),
		);
	},
	dispatchEvent: function (element, root, customActionName, params) {
		const self = this;
		const data = this.tealiumEventDetail(element, root, customActionName, params);
		if (data) {
			if (data['data-uet']['link-type'] === 'button') {
				setTimeout(function () {
					self.callEvent(root, data);
				}, 500);
			} else {
				this.callEvent(root, data);
			}
			this.devConsole(data);
		}
	},
	onClickEvent: function (element, root) {
		while (element && element !== root) {
			if (
				this.uetElementsArray.includes(this.getElementTagName(element)) ||
				this.uetInputTypeArray.includes(element.type)
			) {
				this.dispatchEvent(element, root);
				break;
			}
			element = this.getParentElement(element);
		}
	},
	findInParents: function (element, root, attribute) {
		let elem = element;
		let rootReached = false;
		const ret = [];
		const rootAttribute = attribute + '-root';
		while (elem) {
			if (elem.getAttribute(attribute)) {
				ret.unshift(elem.getAttribute(attribute));
			}
			if (elem.getAttribute(rootAttribute)) {
				ret.unshift(elem.getAttribute(rootAttribute));
				break;
			}
			const parent = this.getParentElement(elem);
			if (!parent || rootReached) {
				break;
			}
			if (parent === root) {
				rootReached = true;
			}
			elem = parent;
		}
		return ret.length ? ret.join(' > ') : '';
	},
	devConsole: function (data) {
		window.sessionStorage.getItem('msiDev') !== null &&
			(console.table || console.log)(
				Object.assign({}, data['data-uet'], { action: data.action }, data['data-ecomm']),
			);
	},
	getXPath: function (element) {
		if (element.id !== '') return element.id;
		if (element === document.body) return element.tagName;

		let ix = 0;
		const siblings = element.parentNode.childNodes;
		for (let i = 0; i < siblings.length; i++) {
			const sibling = siblings[i];
			if (sibling === element) {
				return (
					this.getXPath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']'
				);
			}
			if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
				ix++;
			}
		}
		return null;
	},
	init: function () {
		const self = this;
		window.document.addEventListener('click', function (event) {
			const element = self.getEventTarget(event);
			const root = element.closest('[data-uet-event]');
			if (root) {
				self.onClickEvent(element, root);
			}
		});
		// In case when user press Enter key and triggered some redirection to other page then `keyup` can be not triggered
		window.document.addEventListener('keydown', function (event) {
			/**
			 * To defind that input has Search functionality must use any combination word "search" in className
			 * Example: 'search', 'header-search', 'any-class-with-word-search'
			 */
			const element = self.getEventTarget(event);
			const root = element.closest('[data-uet-event]');
			if (
				root &&
				self.uetFormElementsArray.includes(element.tagName) &&
				element.className &&
				element.className.includes('search') &&
				event.key === 'Enter'
			) {
				self.dispatchEvent(element, root, 'keypress');
			}
		});
		window.document.addEventListener('focusout', function (event) {
			const element = self.getEventTarget(event);
			const root = element.closest('[data-uet-event]');
			if (
				root &&
				self.uetFormElementsArray.includes(element.tagName) &&
				!self.uetInputTypeArray.includes(element.type)
			) {
				self.dispatchEvent(element, root);
			}
		});
		return true;
	},
};

// IE11 polyfills

(function () {
	if (typeof window.CustomEvent === 'function') return;

	function CustomEvent(event, params) {
		// eslint-disable-next-line no-param-reassign
		params = params || { bubbles: false, cancelable: false, detail: null };
		const evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	window.CustomEvent = CustomEvent;
})();

const ElementPrototype = window.Element.prototype;
if (typeof ElementPrototype.matches !== 'function') {
	ElementPrototype.matches =
		ElementPrototype.msMatchesSelector ||
		ElementPrototype.mozMatchesSelector ||
		ElementPrototype.webkitMatchesSelector ||
		function matches(selector) {
			const element = this;
			const elements = (element.document || element.ownerDocument).querySelectorAll(selector);
			let index = 0;

			while (elements[index] && elements[index] !== element) {
				index += 1;
			}

			return Boolean(elements[index]);
		};
}
if (typeof ElementPrototype.closest !== 'function') {
	ElementPrototype.closest = function closest(selector) {
		let element = this;

		while (element && element.nodeType === 1) {
			if (element.matches(selector)) {
				return element;
			}
			element = element.parentNode;
		}

		return null;
	};
}

if (!Array.prototype.includes) {
	Array.prototype.includes = function (searchElement /* , fromIndex */) {
		const O = Object(this);
		const len = parseInt(O.length) || 0;
		if (len === 0) {
			return false;
		}
		const n = parseInt(arguments[1]) || 0;
		let k;
		if (n >= 0) {
			k = n;
		} else {
			k = len + n;
			if (k < 0) {
				k = 0;
			}
		}
		let currentElement;
		while (k < len) {
			currentElement = O[k];
			if (
				searchElement === currentElement ||
				(searchElement !== searchElement && currentElement !== currentElement)
			) {
				// NaN !== NaN
				return true;
			}
			k++;
		}
		return false;
	};
}

if (!String.prototype.includes) {
	String.prototype.includes = function (search, start) {
		if (search instanceof RegExp) {
			throw TypeError('first argument must not be a RegExp');
		}
		if (start === undefined) {
			start = 0;
		}
		return this.indexOf(search, start) !== -1;
	};
}

window.msiGlobalTagging.init();
