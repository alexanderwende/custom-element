(function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const directives = new WeakMap();
    const isDirective = (o) => {
        return typeof o === 'function' && directives.has(o);
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * True if the custom elements polyfill is in use.
     */
    const isCEPolyfill = window.customElements !== undefined &&
        window.customElements.polyfillWrapFlushCallback !==
            undefined;
    /**
     * Removes nodes, starting from `startNode` (inclusive) to `endNode`
     * (exclusive), from `container`.
     */
    const removeNodes = (container, startNode, endNode = null) => {
        let node = startNode;
        while (node !== endNode) {
            const n = node.nextSibling;
            container.removeChild(node);
            node = n;
        }
    };

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * A sentinel value that signals that a value was handled by a directive and
     * should not be written to the DOM.
     */
    const noChange = {};
    /**
     * A sentinel value that signals a NodePart to fully clear its content.
     */
    const nothing = {};

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An expression marker with embedded unique key to avoid collision with
     * possible text in templates.
     */
    const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
    /**
     * An expression marker used text-positions, multi-binding attributes, and
     * attributes with markup-like text values.
     */
    const nodeMarker = `<!--${marker}-->`;
    const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
    /**
     * Suffix appended to all bound attribute names.
     */
    const boundAttributeSuffix = '$lit$';
    /**
     * An updateable Template that tracks the location of dynamic parts.
     */
    class Template {
        constructor(result, element) {
            this.parts = [];
            this.element = element;
            let index = -1;
            let partIndex = 0;
            const nodesToRemove = [];
            const _prepareTemplate = (template) => {
                const content = template.content;
                // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
                // null
                const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
                // Keeps track of the last index associated with a part. We try to delete
                // unnecessary nodes, but we never want to associate two different parts
                // to the same index. They must have a constant node between.
                let lastPartIndex = 0;
                while (walker.nextNode()) {
                    index++;
                    const node = walker.currentNode;
                    if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                        if (node.hasAttributes()) {
                            const attributes = node.attributes;
                            // Per
                            // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                            // attributes are not guaranteed to be returned in document order.
                            // In particular, Edge/IE can return them out of order, so we cannot
                            // assume a correspondance between part index and attribute index.
                            let count = 0;
                            for (let i = 0; i < attributes.length; i++) {
                                if (attributes[i].value.indexOf(marker) >= 0) {
                                    count++;
                                }
                            }
                            while (count-- > 0) {
                                // Get the template literal section leading up to the first
                                // expression in this attribute
                                const stringForPart = result.strings[partIndex];
                                // Find the attribute name
                                const name = lastAttributeNameRegex.exec(stringForPart)[2];
                                // Find the corresponding attribute
                                // All bound attributes have had a suffix added in
                                // TemplateResult#getHTML to opt out of special attribute
                                // handling. To look up the attribute value we also need to add
                                // the suffix.
                                const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                                const attributeValue = node.getAttribute(attributeLookupName);
                                const strings = attributeValue.split(markerRegex);
                                this.parts.push({ type: 'attribute', index, name, strings });
                                node.removeAttribute(attributeLookupName);
                                partIndex += strings.length - 1;
                            }
                        }
                        if (node.tagName === 'TEMPLATE') {
                            _prepareTemplate(node);
                        }
                    }
                    else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                        const data = node.data;
                        if (data.indexOf(marker) >= 0) {
                            const parent = node.parentNode;
                            const strings = data.split(markerRegex);
                            const lastIndex = strings.length - 1;
                            // Generate a new text node for each literal section
                            // These nodes are also used as the markers for node parts
                            for (let i = 0; i < lastIndex; i++) {
                                parent.insertBefore((strings[i] === '') ? createMarker() :
                                    document.createTextNode(strings[i]), node);
                                this.parts.push({ type: 'node', index: ++index });
                            }
                            // If there's no text, we must insert a comment to mark our place.
                            // Else, we can trust it will stick around after cloning.
                            if (strings[lastIndex] === '') {
                                parent.insertBefore(createMarker(), node);
                                nodesToRemove.push(node);
                            }
                            else {
                                node.data = strings[lastIndex];
                            }
                            // We have a part for each match found
                            partIndex += lastIndex;
                        }
                    }
                    else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                        if (node.data === marker) {
                            const parent = node.parentNode;
                            // Add a new marker node to be the startNode of the Part if any of
                            // the following are true:
                            //  * We don't have a previousSibling
                            //  * The previousSibling is already the start of a previous part
                            if (node.previousSibling === null || index === lastPartIndex) {
                                index++;
                                parent.insertBefore(createMarker(), node);
                            }
                            lastPartIndex = index;
                            this.parts.push({ type: 'node', index });
                            // If we don't have a nextSibling, keep this node so we have an end.
                            // Else, we can remove it to save future costs.
                            if (node.nextSibling === null) {
                                node.data = '';
                            }
                            else {
                                nodesToRemove.push(node);
                                index--;
                            }
                            partIndex++;
                        }
                        else {
                            let i = -1;
                            while ((i = node.data.indexOf(marker, i + 1)) !==
                                -1) {
                                // Comment node has a binding marker inside, make an inactive part
                                // The binding won't work, but subsequent bindings will
                                // TODO (justinfagnani): consider whether it's even worth it to
                                // make bindings in comments work
                                this.parts.push({ type: 'node', index: -1 });
                            }
                        }
                    }
                }
            };
            _prepareTemplate(element);
            // Remove text binding nodes after the walk to not disturb the TreeWalker
            for (const n of nodesToRemove) {
                n.parentNode.removeChild(n);
            }
        }
    }
    const isTemplatePartActive = (part) => part.index !== -1;
    // Allows `document.createComment('')` to be renamed for a
    // small manual size-savings.
    const createMarker = () => document.createComment('');
    /**
     * This regex extracts the attribute name preceding an attribute-position
     * expression. It does this by matching the syntax allowed for attributes
     * against the string literal directly preceding the expression, assuming that
     * the expression is in an attribute-value position.
     *
     * See attributes in the HTML spec:
     * https://www.w3.org/TR/html5/syntax.html#attributes-0
     *
     * "\0-\x1F\x7F-\x9F" are Unicode control characters
     *
     * " \x09\x0a\x0c\x0d" are HTML space characters:
     * https://www.w3.org/TR/html5/infrastructure.html#space-character
     *
     * So an attribute is:
     *  * The name: any character except a control character, space character, ('),
     *    ("), ">", "=", or "/"
     *  * Followed by zero or more space characters
     *  * Followed by "="
     *  * Followed by zero or more space characters
     *  * Followed by:
     *    * Any character except space, ('), ("), "<", ">", "=", (`), or
     *    * (") then any non-("), or
     *    * (') then any non-(')
     */
    const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An instance of a `Template` that can be attached to the DOM and updated
     * with new values.
     */
    class TemplateInstance {
        constructor(template, processor, options) {
            this._parts = [];
            this.template = template;
            this.processor = processor;
            this.options = options;
        }
        update(values) {
            let i = 0;
            for (const part of this._parts) {
                if (part !== undefined) {
                    part.setValue(values[i]);
                }
                i++;
            }
            for (const part of this._parts) {
                if (part !== undefined) {
                    part.commit();
                }
            }
        }
        _clone() {
            // When using the Custom Elements polyfill, clone the node, rather than
            // importing it, to keep the fragment in the template's document. This
            // leaves the fragment inert so custom elements won't upgrade and
            // potentially modify their contents by creating a polyfilled ShadowRoot
            // while we traverse the tree.
            const fragment = isCEPolyfill ?
                this.template.element.content.cloneNode(true) :
                document.importNode(this.template.element.content, true);
            const parts = this.template.parts;
            let partIndex = 0;
            let nodeIndex = 0;
            const _prepareInstance = (fragment) => {
                // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
                // null
                const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
                let node = walker.nextNode();
                // Loop through all the nodes and parts of a template
                while (partIndex < parts.length && node !== null) {
                    const part = parts[partIndex];
                    // Consecutive Parts may have the same node index, in the case of
                    // multiple bound attributes on an element. So each iteration we either
                    // increment the nodeIndex, if we aren't on a node with a part, or the
                    // partIndex if we are. By not incrementing the nodeIndex when we find a
                    // part, we allow for the next part to be associated with the current
                    // node if neccessasry.
                    if (!isTemplatePartActive(part)) {
                        this._parts.push(undefined);
                        partIndex++;
                    }
                    else if (nodeIndex === part.index) {
                        if (part.type === 'node') {
                            const part = this.processor.handleTextExpression(this.options);
                            part.insertAfterNode(node.previousSibling);
                            this._parts.push(part);
                        }
                        else {
                            this._parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                        }
                        partIndex++;
                    }
                    else {
                        nodeIndex++;
                        if (node.nodeName === 'TEMPLATE') {
                            _prepareInstance(node.content);
                        }
                        node = walker.nextNode();
                    }
                }
            };
            _prepareInstance(fragment);
            if (isCEPolyfill) {
                document.adoptNode(fragment);
                customElements.upgrade(fragment);
            }
            return fragment;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The return type of `html`, which holds a Template and the values from
     * interpolated expressions.
     */
    class TemplateResult {
        constructor(strings, values, type, processor) {
            this.strings = strings;
            this.values = values;
            this.type = type;
            this.processor = processor;
        }
        /**
         * Returns a string of HTML used to create a `<template>` element.
         */
        getHTML() {
            const endIndex = this.strings.length - 1;
            let html = '';
            for (let i = 0; i < endIndex; i++) {
                const s = this.strings[i];
                // This exec() call does two things:
                // 1) Appends a suffix to the bound attribute name to opt out of special
                // attribute value parsing that IE11 and Edge do, like for style and
                // many SVG attributes. The Template class also appends the same suffix
                // when looking up attributes to create Parts.
                // 2) Adds an unquoted-attribute-safe marker for the first expression in
                // an attribute. Subsequent attribute expressions will use node markers,
                // and this is safe since attributes with multiple expressions are
                // guaranteed to be quoted.
                const match = lastAttributeNameRegex.exec(s);
                if (match) {
                    // We're starting a new bound attribute.
                    // Add the safe attribute suffix, and use unquoted-attribute-safe
                    // marker.
                    html += s.substr(0, match.index) + match[1] + match[2] +
                        boundAttributeSuffix + match[3] + marker;
                }
                else {
                    // We're either in a bound node, or trailing bound attribute.
                    // Either way, nodeMarker is safe to use.
                    html += s + nodeMarker;
                }
            }
            return html + this.strings[endIndex];
        }
        getTemplateElement() {
            const template = document.createElement('template');
            template.innerHTML = this.getHTML();
            return template;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const isPrimitive = (value) => {
        return (value === null ||
            !(typeof value === 'object' || typeof value === 'function'));
    };
    /**
     * Sets attribute values for AttributeParts, so that the value is only set once
     * even if there are multiple parts for an attribute.
     */
    class AttributeCommitter {
        constructor(element, name, strings) {
            this.dirty = true;
            this.element = element;
            this.name = name;
            this.strings = strings;
            this.parts = [];
            for (let i = 0; i < strings.length - 1; i++) {
                this.parts[i] = this._createPart();
            }
        }
        /**
         * Creates a single part. Override this to create a differnt type of part.
         */
        _createPart() {
            return new AttributePart(this);
        }
        _getValue() {
            const strings = this.strings;
            const l = strings.length - 1;
            let text = '';
            for (let i = 0; i < l; i++) {
                text += strings[i];
                const part = this.parts[i];
                if (part !== undefined) {
                    const v = part.value;
                    if (v != null &&
                        (Array.isArray(v) ||
                            // tslint:disable-next-line:no-any
                            typeof v !== 'string' && v[Symbol.iterator])) {
                        for (const t of v) {
                            text += typeof t === 'string' ? t : String(t);
                        }
                    }
                    else {
                        text += typeof v === 'string' ? v : String(v);
                    }
                }
            }
            text += strings[l];
            return text;
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                this.element.setAttribute(this.name, this._getValue());
            }
        }
    }
    class AttributePart {
        constructor(comitter) {
            this.value = undefined;
            this.committer = comitter;
        }
        setValue(value) {
            if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
                this.value = value;
                // If the value is a not a directive, dirty the committer so that it'll
                // call setAttribute. If the value is a directive, it'll dirty the
                // committer if it calls setValue().
                if (!isDirective(value)) {
                    this.committer.dirty = true;
                }
            }
        }
        commit() {
            while (isDirective(this.value)) {
                const directive$$1 = this.value;
                this.value = noChange;
                directive$$1(this);
            }
            if (this.value === noChange) {
                return;
            }
            this.committer.commit();
        }
    }
    class NodePart {
        constructor(options) {
            this.value = undefined;
            this._pendingValue = undefined;
            this.options = options;
        }
        /**
         * Inserts this part into a container.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendInto(container) {
            this.startNode = container.appendChild(createMarker());
            this.endNode = container.appendChild(createMarker());
        }
        /**
         * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
         * its next sibling must be static, unchanging nodes such as those that appear
         * in a literal section of a template.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterNode(ref) {
            this.startNode = ref;
            this.endNode = ref.nextSibling;
        }
        /**
         * Appends this part into a parent part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendIntoPart(part) {
            part._insert(this.startNode = createMarker());
            part._insert(this.endNode = createMarker());
        }
        /**
         * Appends this part after `ref`
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterPart(ref) {
            ref._insert(this.startNode = createMarker());
            this.endNode = ref.endNode;
            ref.endNode = this.startNode;
        }
        setValue(value) {
            this._pendingValue = value;
        }
        commit() {
            while (isDirective(this._pendingValue)) {
                const directive$$1 = this._pendingValue;
                this._pendingValue = noChange;
                directive$$1(this);
            }
            const value = this._pendingValue;
            if (value === noChange) {
                return;
            }
            if (isPrimitive(value)) {
                if (value !== this.value) {
                    this._commitText(value);
                }
            }
            else if (value instanceof TemplateResult) {
                this._commitTemplateResult(value);
            }
            else if (value instanceof Node) {
                this._commitNode(value);
            }
            else if (Array.isArray(value) ||
                // tslint:disable-next-line:no-any
                value[Symbol.iterator]) {
                this._commitIterable(value);
            }
            else if (value === nothing) {
                this.value = nothing;
                this.clear();
            }
            else {
                // Fallback, will render the string representation
                this._commitText(value);
            }
        }
        _insert(node) {
            this.endNode.parentNode.insertBefore(node, this.endNode);
        }
        _commitNode(value) {
            if (this.value === value) {
                return;
            }
            this.clear();
            this._insert(value);
            this.value = value;
        }
        _commitText(value) {
            const node = this.startNode.nextSibling;
            value = value == null ? '' : value;
            if (node === this.endNode.previousSibling &&
                node.nodeType === 3 /* Node.TEXT_NODE */) {
                // If we only have a single text node between the markers, we can just
                // set its value, rather than replacing it.
                // TODO(justinfagnani): Can we just check if this.value is primitive?
                node.data = value;
            }
            else {
                this._commitNode(document.createTextNode(typeof value === 'string' ? value : String(value)));
            }
            this.value = value;
        }
        _commitTemplateResult(value) {
            const template = this.options.templateFactory(value);
            if (this.value instanceof TemplateInstance &&
                this.value.template === template) {
                this.value.update(value.values);
            }
            else {
                // Make sure we propagate the template processor from the TemplateResult
                // so that we use its syntax extension, etc. The template factory comes
                // from the render function options so that it can control template
                // caching and preprocessing.
                const instance = new TemplateInstance(template, value.processor, this.options);
                const fragment = instance._clone();
                instance.update(value.values);
                this._commitNode(fragment);
                this.value = instance;
            }
        }
        _commitIterable(value) {
            // For an Iterable, we create a new InstancePart per item, then set its
            // value to the item. This is a little bit of overhead for every item in
            // an Iterable, but it lets us recurse easily and efficiently update Arrays
            // of TemplateResults that will be commonly returned from expressions like:
            // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
            // If _value is an array, then the previous render was of an
            // iterable and _value will contain the NodeParts from the previous
            // render. If _value is not an array, clear this part and make a new
            // array for NodeParts.
            if (!Array.isArray(this.value)) {
                this.value = [];
                this.clear();
            }
            // Lets us keep track of how many items we stamped so we can clear leftover
            // items from a previous render
            const itemParts = this.value;
            let partIndex = 0;
            let itemPart;
            for (const item of value) {
                // Try to reuse an existing part
                itemPart = itemParts[partIndex];
                // If no existing part, create a new one
                if (itemPart === undefined) {
                    itemPart = new NodePart(this.options);
                    itemParts.push(itemPart);
                    if (partIndex === 0) {
                        itemPart.appendIntoPart(this);
                    }
                    else {
                        itemPart.insertAfterPart(itemParts[partIndex - 1]);
                    }
                }
                itemPart.setValue(item);
                itemPart.commit();
                partIndex++;
            }
            if (partIndex < itemParts.length) {
                // Truncate the parts array so _value reflects the current state
                itemParts.length = partIndex;
                this.clear(itemPart && itemPart.endNode);
            }
        }
        clear(startNode = this.startNode) {
            removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
        }
    }
    /**
     * Implements a boolean attribute, roughly as defined in the HTML
     * specification.
     *
     * If the value is truthy, then the attribute is present with a value of
     * ''. If the value is falsey, the attribute is removed.
     */
    class BooleanAttributePart {
        constructor(element, name, strings) {
            this.value = undefined;
            this._pendingValue = undefined;
            if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
                throw new Error('Boolean attributes can only contain a single expression');
            }
            this.element = element;
            this.name = name;
            this.strings = strings;
        }
        setValue(value) {
            this._pendingValue = value;
        }
        commit() {
            while (isDirective(this._pendingValue)) {
                const directive$$1 = this._pendingValue;
                this._pendingValue = noChange;
                directive$$1(this);
            }
            if (this._pendingValue === noChange) {
                return;
            }
            const value = !!this._pendingValue;
            if (this.value !== value) {
                if (value) {
                    this.element.setAttribute(this.name, '');
                }
                else {
                    this.element.removeAttribute(this.name);
                }
            }
            this.value = value;
            this._pendingValue = noChange;
        }
    }
    /**
     * Sets attribute values for PropertyParts, so that the value is only set once
     * even if there are multiple parts for a property.
     *
     * If an expression controls the whole property value, then the value is simply
     * assigned to the property under control. If there are string literals or
     * multiple expressions, then the strings are expressions are interpolated into
     * a string first.
     */
    class PropertyCommitter extends AttributeCommitter {
        constructor(element, name, strings) {
            super(element, name, strings);
            this.single =
                (strings.length === 2 && strings[0] === '' && strings[1] === '');
        }
        _createPart() {
            return new PropertyPart(this);
        }
        _getValue() {
            if (this.single) {
                return this.parts[0].value;
            }
            return super._getValue();
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                // tslint:disable-next-line:no-any
                this.element[this.name] = this._getValue();
            }
        }
    }
    class PropertyPart extends AttributePart {
    }
    // Detect event listener options support. If the `capture` property is read
    // from the options object, then options are supported. If not, then the thrid
    // argument to add/removeEventListener is interpreted as the boolean capture
    // value so we should only pass the `capture` property.
    let eventOptionsSupported = false;
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // tslint:disable-next-line:no-any
        window.addEventListener('test', options, options);
        // tslint:disable-next-line:no-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
    }
    class EventPart {
        constructor(element, eventName, eventContext) {
            this.value = undefined;
            this._pendingValue = undefined;
            this.element = element;
            this.eventName = eventName;
            this.eventContext = eventContext;
            this._boundHandleEvent = (e) => this.handleEvent(e);
        }
        setValue(value) {
            this._pendingValue = value;
        }
        commit() {
            while (isDirective(this._pendingValue)) {
                const directive$$1 = this._pendingValue;
                this._pendingValue = noChange;
                directive$$1(this);
            }
            if (this._pendingValue === noChange) {
                return;
            }
            const newListener = this._pendingValue;
            const oldListener = this.value;
            const shouldRemoveListener = newListener == null ||
                oldListener != null &&
                    (newListener.capture !== oldListener.capture ||
                        newListener.once !== oldListener.once ||
                        newListener.passive !== oldListener.passive);
            const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
            if (shouldRemoveListener) {
                this.element.removeEventListener(this.eventName, this._boundHandleEvent, this._options);
            }
            if (shouldAddListener) {
                this._options = getOptions(newListener);
                this.element.addEventListener(this.eventName, this._boundHandleEvent, this._options);
            }
            this.value = newListener;
            this._pendingValue = noChange;
        }
        handleEvent(event) {
            if (typeof this.value === 'function') {
                this.value.call(this.eventContext || this.element, event);
            }
            else {
                this.value.handleEvent(event);
            }
        }
    }
    // We copy options because of the inconsistent behavior of browsers when reading
    // the third argument of add/removeEventListener. IE11 doesn't support options
    // at all. Chrome 41 only reads `capture` if the argument is an object.
    const getOptions = (o) => o &&
        (eventOptionsSupported ?
            { capture: o.capture, passive: o.passive, once: o.once } :
            o.capture);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Creates Parts when a template is instantiated.
     */
    class DefaultTemplateProcessor {
        /**
         * Create parts for an attribute-position binding, given the event, attribute
         * name, and string literals.
         *
         * @param element The element containing the binding
         * @param name  The attribute name
         * @param strings The string literals. There are always at least two strings,
         *   event for fully-controlled bindings with a single expression.
         */
        handleAttributeExpressions(element, name, strings, options) {
            const prefix = name[0];
            if (prefix === '.') {
                const comitter = new PropertyCommitter(element, name.slice(1), strings);
                return comitter.parts;
            }
            if (prefix === '@') {
                return [new EventPart(element, name.slice(1), options.eventContext)];
            }
            if (prefix === '?') {
                return [new BooleanAttributePart(element, name.slice(1), strings)];
            }
            const comitter = new AttributeCommitter(element, name, strings);
            return comitter.parts;
        }
        /**
         * Create parts for a text-position binding.
         * @param templateFactory
         */
        handleTextExpression(options) {
            return new NodePart(options);
        }
    }
    const defaultTemplateProcessor = new DefaultTemplateProcessor();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The default TemplateFactory which caches Templates keyed on
     * result.type and result.strings.
     */
    function templateFactory(result) {
        let templateCache = templateCaches.get(result.type);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(result.type, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        // If the TemplateStringsArray is new, generate a key from the strings
        // This key is shared between all templates with identical content
        const key = result.strings.join(marker);
        // Check if we already have a Template for this key
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            // If we have not seen this key before, create a new Template
            template = new Template(result, result.getTemplateElement());
            // Cache the Template for this key
            templateCache.keyString.set(key, template);
        }
        // Cache all future queries for this TemplateStringsArray
        templateCache.stringsArray.set(result.strings, template);
        return template;
    }
    const templateCaches = new Map();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const parts = new WeakMap();
    /**
     * Renders a template to a container.
     *
     * To update a container with new values, reevaluate the template literal and
     * call `render` with the new result.
     *
     * @param result a TemplateResult created by evaluating a template tag like
     *     `html` or `svg`.
     * @param container A DOM parent to render to. The entire contents are either
     *     replaced, or efficiently updated if the same result type was previous
     *     rendered there.
     * @param options RenderOptions for the entire render tree rendered to this
     *     container. Render options must *not* change between renders to the same
     *     container, as those changes will not effect previously rendered DOM.
     */
    const render = (result, container, options) => {
        let part = parts.get(container);
        if (part === undefined) {
            removeNodes(container, container.firstChild);
            parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
            part.appendInto(container);
        }
        part.setValue(result);
        part.commit();
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for lit-html usage.
    // TODO(justinfagnani): inject version number at build time
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     */
    const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

    const SPACES = /\s+([\S])/g;
    const CAMELS = /[a-z]([A-Z])/g;
    function kebabCase(string) {
        let matches;
        if (string) {
            string = string.trim();
            while ((matches = SPACES.exec(string))) {
                string = string.replace(matches[0], '-' + matches[1]);
                SPACES.lastIndex = 0;
            }
            while ((matches = CAMELS.exec(string))) {
                string = string.replace(matches[0], matches[0][0] + '-' + matches[1]);
                CAMELS.lastIndex = 0;
            }
        }
        return string ? string.toLowerCase() : string;
    }

    /**
     * The default attribute converter
     *
     * @remarks
     * This converter is used as the default converter for decorated properties unless a different one
     * is specified. The converter tries to infer the property type when converting to attributes and
     * uses `JSON.parse()` when converting strings from attributes. If `JSON.parse()` throws an error,
     * the converter will use the attribute value as a string.
     */
    const AttributeConverterDefault = {
        fromAttribute: (value) => {
            // `JSON.parse()` will throw an error for empty strings - we consider it null
            if (value === null || value === '') {
                return null;
            }
            else
                try {
                    // `JSON.parse()` will successfully parse `boolean`, `number` and `JSON.stringify`'d values
                    return JSON.parse(value);
                }
                catch (error) {
                    // if it throws, it means we're probably dealing with a regular string
                    return value;
                }
        },
        toAttribute: (value) => {
            switch (typeof value) {
                case 'boolean':
                    return value ? '' : null;
                case 'object':
                    return (value == null) ? value : JSON.stringify(value);
                case 'undefined':
                    return value;
                case 'string':
                    return value;
                default: // number, bigint, symbol, function
                    return value.toString();
            }
        }
    };
    const AttributeConverterBoolean = {
        fromAttribute: (value) => (value !== null),
        toAttribute: (value) => value ? '' : null
    };

    /**
     * A type guard for {@link AttributeReflector}
     *
     * @param reflector A reflector to test
     */
    function isAttributeReflector(reflector) {
        return typeof reflector === 'function';
    }
    /**
     * A type guard for {@link PropertyReflector}
     *
     * @param reflector A reflector to test
     */
    function isPropertyReflector(reflector) {
        return typeof reflector === 'function';
    }
    /**
     * A type guard for {@link PropertyNotifier}
     *
     * @param notifier A notifier to test
     */
    function isPropertyNotifier(notifier) {
        return typeof notifier === 'function';
    }
    /**
     * A type guard for {@link PropertyChangeDetector}
     *
     * @param detector A detector to test
     */
    function isPropertyChangeDetector(detector) {
        return typeof detector === 'function';
    }
    /**
     * A type guard for {@link PropertyKey}
     *
     * @param key A property key to test
     */
    function isPropertyKey(key) {
        return typeof key === 'string' || typeof key === 'number' || typeof key === 'symbol';
    }
    /**
     * Encodes a string for use as html attribute removing invalid attribute characters
     *
     * @param value A string to encode for use as html attribute
     * @returns     An encoded string usable as html attribute
     */
    function encodeAttribute(value) {
        return kebabCase(value.replace(/\W+/g, '-').replace(/\-$/, ''));
    }
    /**
     * A helper function to create an attribute name from a property key
     *
     * @remarks
     * Numeric property indexes or symbols can contain invalid characters for attribute names. This method
     * sanitizes those characters and replaces sequences of invalid characters with a dash.
     * Attribute names are not allowed to start with numbers either and are prefixed with 'attr-'.
     *
     * N.B.: When using custom symbols as property keys, use unique descriptions for the symbols to avoid
     * clashing attribute names.
     *
     * ```typescript
     * const a = Symbol();
     * const b = Symbol();
     *
     * a !== b; // true
     *
     * createAttributeName(a) !== createAttributeName(b); // false --> 'attr-symbol' === 'attr-symbol'
     *
     * const c = Symbol('c');
     * const d = Symbol('d');
     *
     * c !== d; // true
     *
     * createAttributeName(c) !== createAttributeName(d); // true --> 'attr-symbol-c' === 'attr-symbol-d'
     * ```
     *
     * @param propertyKey   A property key to convert to an attribute name
     * @returns             The generated attribute name
     */
    function createAttributeName(propertyKey) {
        if (typeof propertyKey === 'string') {
            return kebabCase(propertyKey);
        }
        else {
            // TODO: this could create multiple identical attribute names, if symbols don't have unique description
            return `attr-${encodeAttribute(String(propertyKey))}`;
        }
    }
    /**
     * A helper function to create an event name from a property key
     *
     * @remarks
     * Event names don't have the same restrictions as attribute names when it comes to invalid
     * characters. However, for consistencies sake, we apply the same rules for event names as
     * for attribute names.
     *
     * @param propertyKey   A property key to convert to an attribute name
     * @param prefix        An optional prefix, e.g.: 'on'
     * @param suffix        An optional suffix, e.g.: 'changed'
     * @returns             The generated event name
     */
    function createEventName(propertyKey, prefix, suffix) {
        let propertyString = '';
        if (typeof propertyKey === 'string') {
            propertyString = kebabCase(propertyKey);
        }
        else {
            // TODO: this could create multiple identical event names, if symbols don't have unique description
            propertyString = encodeAttribute(String(propertyKey));
        }
        return `${prefix ? `${kebabCase(prefix)}-` : ''}${propertyString}${suffix ? `-${kebabCase(suffix)}` : ''}`;
    }
    /**
     * The default property change detector
     *
     * @param oldValue  The old property value
     * @param newValue  The new property value
     * @returns         A boolean indicating if the property value changed
     */
    const DEFAULT_PROPERTY_CHANGE_DETECTOR = (oldValue, newValue) => {
        // in case `oldValue` and `newValue` are `NaN`, `(NaN !== NaN)` returns `true`,
        // but `(NaN === NaN || NaN === NaN)` returns `false`
        return oldValue !== newValue && (oldValue === oldValue || newValue === newValue);
    };
    /**
     * The default {@link CustomElement} property declaration
     */
    const DEFAULT_PROPERTY_DECLARATION = {
        attribute: true,
        converter: AttributeConverterDefault,
        reflectAttribute: true,
        reflectProperty: true,
        notify: true,
        observe: DEFAULT_PROPERTY_CHANGE_DETECTOR,
    };

    const ATTRIBUTE_REFLECTOR_ERROR = (attributeReflector) => new Error(`Error executing attribute reflector ${String(attributeReflector)}.`);
    const PROPERTY_REFLECTOR_ERROR = (propertyReflector) => new Error(`Error executing property reflector ${String(propertyReflector)}.`);
    const PROPERTY_NOTIFIER_ERROR = (propertyNotifier) => new Error(`Error executing property notifier ${String(propertyNotifier)}.`);
    const CHANGE_DETECTOR_ERROR = (changeDetector) => new Error(`Error executing property change detector ${String(changeDetector)}.`);
    /**
     * The custom element base class
     */
    class CustomElement extends HTMLElement {
        constructor() {
            super();
            this._updateRequest = Promise.resolve(true);
            this._changedProperties = new Map();
            this._reflectingProperties = new Map();
            this._notifyingProperties = new Map();
            this._listenerDeclarations = [];
            this._isConnected = false;
            this._hasUpdated = false;
            this._hasRequestedUpdate = false;
            this._isReflecting = false;
            this._renderRoot = this.createRenderRoot();
        }
        /**
         * Override to specify attributes which should be observed, but don't have an associated property
         *
         * @remark
         * For properties which are decorated with the {@link property} decorator, an observed attribute
         * is automatically created and does not need to be specified here. Fot attributes that don't
         * have an associated property, return the attribute names in this getter. Changes to these
         * attributes can be handled in the {@link attributeChangedCallback} method.
         *
         * When extending custom elements, make sure to return the super class's observedAttributes
         * if you override this getter (except if you don't want to inherit observed attributes):
         *
         * ```typescript
         * @customElement({
         *      selector: 'my-element'
         * })
         * class MyElement extends MyBaseElement {
         *
         *      static get observedAttributes (): string[] {
         *
         *          return [...super.observedAttributes, 'my-additional-attribute'];
         *      }
         * }
         * ```
         */
        static get observedAttributes() {
            return [];
        }
        /**
         * Returns `true` if the custom element's {@link connectedCallback} was executed.
         */
        get isConnected() {
            return this._isConnected;
        }
        /**
         * Invoked each time the custom element is moved to a new document
         *
         * @remarks
         * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
         */
        adoptedCallback() {
            this._notifyLifecycle('adopted');
        }
        /**
         * Invoked each time the custom element is appended into a document-connected element
         *
         * @remarks
         * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
         */
        connectedCallback() {
            this._isConnected = true;
            this._listen();
            this.requestUpdate();
            this._notifyLifecycle('connected');
        }
        /**
         * Invoked each time the custom element is disconnected from the document's DOM
         *
         * @remarks
         * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
         */
        disconnectedCallback() {
            this._isConnected = false;
            this._unlisten();
            this._notifyLifecycle('disconnected');
        }
        /**
         * Invoked each time one of the custom element's attributes is added, removed, or changed
         *
         * @remarks
         * Which attributes to notice change for is specified in {@link observedAttributes}.
         * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
         *
         * For decorated properties with an associated attribute, this is handled automatically.
         *
         * This method can be overridden to customize the handling of attribute changes. When overriding
         * this method, a super-call should be included, to ensure attribute changes for decorated properties
         * are processed correctly.
         *
         * ```typescript
         * @customElement({
         *      selector: 'my-element'
         * })
         * class MyElement extends CustomElement {
         *
         *      attributeChangedCallback (attribute: string, oldValue: any, newValue: any) {
         *
         *          super.attributeChangedCallback(attribute, oldValue, newValue);
         *
         *          // do custom handling...
         *      }
         * }
         * ```
         *
         * @param attribute The name of the changed attribute
         * @param oldValue  The old value of the attribute
         * @param newValue  The new value of the attribute
         */
        attributeChangedCallback(attribute, oldValue, newValue) {
            if (this._isReflecting)
                return;
            if (oldValue !== newValue)
                this.reflectAttribute(attribute, oldValue, newValue);
        }
        /**
         * Invoked each time the custom element updates
         *
         * @param changedProperties A map of properties that changed in the update, containg the property key and the old value
         * @param firstUpdate       A boolean indicating if this was the first update
         */
        updateCallback(changedProperties, firstUpdate) {
            this._notifyLifecycle('update', { firstUpdate });
        }
        /**
         * Creates the custom element's render root
         *
         * @remarks
         * The render root is where the {@link render} method will attach its DOM output.
         * When using the custom element with shadow mode, it will be a shadow root,
         * otherwise it will be the custom element itself.
         *
         * TODO: Can slots be used without shadow DOM?
         */
        createRenderRoot() {
            return this.constructor.shadow ?
                this.attachShadow({ mode: 'open' }) :
                this;
        }
        /**
         * Returns the template of the custom element
         *
         * @remarks
         * Override this method to provide a template for your custom element. The method must
         * return a {@link lit-html#TemplateResult} which is created using lit-html's
         * {@link lit-html#html | `html`} or {@link lit-html#svg | `svg`} template methods.
         *
         * Return nothing if your component does not need to render a template.
         *
         * ```typescript
         * import { html } from 'lit-html';
         *
         * @customElement({
         *      selector: 'my-element'
         * })
         * class MyElement extends CustomElement {
         *
         *       myProperty = 'Hello';
         *
         *      template () {
         *
         *          html`<h1>${this.myProperty} World!</h1>`;
         *      }
         * }
         * ```
         */
        template() { }
        /**
         * Renders the custom element's template to its {@link _renderRoot}
         *
         * @remarks
         * Uses lit-html's {@link lit-html#render} method to render a {@link lit-html#TemplateResult}.
         */
        render() {
            const template = this.template();
            if (template)
                render(template, this._renderRoot);
        }
        /**
         * Watch property changes occurring in the executor and raise custom events
         *
         * @remarks
         * Property changes should trigger custom events when they are caused by internal state changes,
         * but not if they are caused by a consumer of the custom element API directly, e.g.:
         *
         * ```typescript
         * document.querySelector('my-custom-element').customProperty = true;
         * ```.
         *
         * This means, we cannot automate this process through property setters, as we can't be sure who
         * invoked the setter - internal calls or external calls.
         *
         * One option is to manually raise the event, which can become tedious and forces us to use string-
         * based event names or property names, which are difficult to refactor, e.g.:
         *
         * ```typescript
         * this.customProperty = true;
         * // if we refactor the property name, we can easily miss the notify call
         * this.notify('customProperty');
         * ```
         *
         * A more convenient way is to execute the internal changes in a wrapper which can detect the changed
         * properties and will automatically raise the required events. This eliminates the need to manually
         * raise events and refactoring does no longer affect the process.
         *
         * ```typescript
         * this.watch(() => {
         *
         *      this.customProperty = true;
         *      // we can add more property modifications to notify in here
         * });
         * ```
         *
         * @param executor A function that performs the changes which should be notified
         */
        watch(executor) {
            // back up current changed properties
            const previousChanges = new Map(this._changedProperties);
            // execute the changes
            executor();
            // add all new or updated changed properties to the notifying properties
            for (const [propertyKey, oldValue] of this._changedProperties) {
                if (!previousChanges.has(propertyKey) || this.hasChanged(propertyKey, previousChanges.get(propertyKey), oldValue)) {
                    this._notifyingProperties.set(propertyKey, oldValue);
                }
            }
        }
        /**
         * Request an update of the custom element
         *
         * @remarks
         * This method is called automatically when the value of a decorated property or its associated
         * attribute changes. If you need the custom element to update based on a state change that is
         * not covered by a decorated property, call this method without any arguments.
         *
         * @param propertyKey   The name of the changed property that requests the update
         * @param oldValue      The old property value
         * @param newValue      the new property value
         * @returns             A Promise which is resolved when the update is completed
         */
        requestUpdate(propertyKey, oldValue, newValue) {
            if (propertyKey) {
                if (!this.hasChanged(propertyKey, oldValue, newValue))
                    return this._updateRequest;
                // store changed property for batch processing
                this._changedProperties.set(propertyKey, oldValue);
                // if we are in reflecting state, an attribute is reflecting to this property and we
                // can skip reflecting the property back to the attribute
                // property changes need to be tracked however and {@link render} must be called after
                // the attribute change is reflected to this property
                // TODO: Maybe don't put it here if not marked as reflected
                if (!this._isReflecting)
                    this._reflectingProperties.set(propertyKey, oldValue);
            }
            if (!this._hasRequestedUpdate) {
                // enqueue update request if none was enqueued already
                this._enqueueUpdate();
            }
            return this._updateRequest;
        }
        /**
         * Updates the custom element after an update was requested with {@link requestUpdate}
         *
         * @remarks
         * This method renders the template, reflects changed properties to attributes and
         * dispatches change events for properties which are marked for notification.
         */
        update() {
            this.render();
            // reflect all properties marked for reflection
            this._reflectingProperties.forEach((oldValue, propertyKey) => {
                this.reflectProperty(propertyKey, oldValue, this[propertyKey]);
            });
            // notify all properties marked for notification
            this._notifyingProperties.forEach((oldValue, propertyKey) => {
                this.notifyProperty(propertyKey, oldValue, this[propertyKey]);
            });
            this.updateCallback(this._changedProperties, this._hasUpdated);
            this._hasUpdated = true;
        }
        /**
         * Check if a property changed
         *
         * @remarks
         * This method resolves the {@link PropertyChangeDetector} for the property and returns its result.
         * If none is defined (the property declaration's observe option is `false`) it returns false.
         * It catches any error in custom {@link PropertyChangeDetector}s and throws a more helpful one.
         *
         * @param propertyKey   The key of the property to check
         * @param oldValue      The old property value
         * @param newValue      The new property value
         * @returns             `true` if the property changed, `false` otherwise
         */
        hasChanged(propertyKey, oldValue, newValue) {
            const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
            // observe is either `false` or a {@link PropertyChangeDetector}
            if (propertyDeclaration && isPropertyChangeDetector(propertyDeclaration.observe)) {
                try {
                    return propertyDeclaration.observe.call(null, oldValue, newValue);
                }
                catch (error) {
                    throw CHANGE_DETECTOR_ERROR(propertyDeclaration.observe);
                }
            }
            return false;
        }
        /**
         * Reflect an attribute value to its associated property
         *
         * @remarks
         * This method checks, if any custom {@link AttributeReflector} has been defined for the
         * associated property and invokes the appropriate reflector. If not, it will use the default
         * reflector {@link _reflectAttribute}.
         *
         * It catches any error in custom {@link AttributeReflector}s and throws a more helpful one.
         *
         * @param attributeName The propert key of the property to reflect
         * @param oldValue      The old property value
         * @param newValue      The new property value
         */
        reflectAttribute(attributeName, oldValue, newValue) {
            const constructor = this.constructor;
            const propertyKey = constructor.attributes.get(attributeName);
            // ignore user-defined observed attributes
            // TODO: test this
            if (!propertyKey) {
                console.log(`observed attribute "${attributeName}" not found... ignoring...`);
                return;
            }
            const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
            // don't reflect if {@link propertyDeclaration.reflectAttribute} is false
            if (propertyDeclaration.reflectAttribute) {
                this._isReflecting = true;
                if (isAttributeReflector(propertyDeclaration.reflectAttribute)) {
                    try {
                        propertyDeclaration.reflectAttribute.call(this, attributeName, oldValue, newValue);
                    }
                    catch (error) {
                        throw ATTRIBUTE_REFLECTOR_ERROR(propertyDeclaration.reflectAttribute);
                    }
                }
                else if (isPropertyKey(propertyDeclaration.reflectAttribute)) {
                    try {
                        this[propertyDeclaration.reflectAttribute](attributeName, oldValue, newValue);
                    }
                    catch (error) {
                        throw ATTRIBUTE_REFLECTOR_ERROR(propertyDeclaration.reflectAttribute);
                    }
                }
                else {
                    this._reflectAttribute(attributeName, oldValue, newValue);
                }
                this._isReflecting = false;
            }
        }
        /**
         * Reflect a property value to its associated attribute
         *
         * @remarks
         * This method checks, if any custom {@link PropertyReflector} has been defined for the
         * property and invokes the appropriate reflector. If not, it will use the default
         * reflector {@link _reflectProperty}.
         *
         * It catches any error in custom {@link PropertyReflector}s and throws a more helpful one.
         *
         * @param propertyKey   The propert key of the property to reflect
         * @param oldValue      The old property value
         * @param newValue      The new property value
         */
        reflectProperty(propertyKey, oldValue, newValue) {
            const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
            // don't reflect if {@link propertyDeclaration.reflectProperty} is false
            if (propertyDeclaration && propertyDeclaration.reflectProperty) {
                // attributeChangedCallback is called synchronously, we can catch the state there
                this._isReflecting = true;
                if (isPropertyReflector(propertyDeclaration.reflectProperty)) {
                    try {
                        propertyDeclaration.reflectProperty.call(this, propertyKey, oldValue, newValue);
                    }
                    catch (error) {
                        throw PROPERTY_REFLECTOR_ERROR(propertyDeclaration.reflectProperty);
                    }
                }
                else if (isPropertyKey(propertyDeclaration.reflectProperty)) {
                    try {
                        this[propertyDeclaration.reflectProperty](propertyKey, oldValue, newValue);
                    }
                    catch (error) {
                        throw PROPERTY_REFLECTOR_ERROR(propertyDeclaration.reflectProperty);
                    }
                }
                else {
                    this._reflectProperty(propertyKey, oldValue, newValue);
                }
                this._isReflecting = false;
            }
        }
        /**
         * Raise an event for a property change
         *
         * @remarks
         * This method checks, if any custom {@link PropertyNotifier} has been defined for the
         * property and invokes the appropriate notifier. If not, it will use the default
         * notifier {@link _notifyProperty}.
         *
         * It catches any error in custom {@link PropertyReflector}s and throws a more helpful one.
         *
         * @param propertyKey   The propert key of the property to raise an event for
         * @param oldValue      The old property value
         * @param newValue      The new property value
         */
        notifyProperty(propertyKey, oldValue, newValue) {
            const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
            if (propertyDeclaration && propertyDeclaration.notify) {
                if (isPropertyNotifier(propertyDeclaration.notify)) {
                    try {
                        propertyDeclaration.notify.call(this, propertyKey, oldValue, newValue);
                    }
                    catch (error) {
                        throw PROPERTY_NOTIFIER_ERROR(propertyDeclaration.notify.toString());
                    }
                }
                else if (isPropertyKey(propertyDeclaration.notify)) {
                    try {
                        this[propertyDeclaration.notify](propertyKey, oldValue, newValue);
                    }
                    catch (error) {
                        throw PROPERTY_NOTIFIER_ERROR(propertyDeclaration.notify);
                    }
                }
                else {
                    this._notifyProperty(propertyKey, oldValue, newValue);
                }
            }
        }
        /**
         * The default attribute reflector
         *
         * @remarks
         * If no {@link AttributeReflector} is defined in the {@link PropertyDeclaration} this
         * method is used to reflect the attribute value to its associated property.
         *
         * @param attributeName The name of the attribute to reflect
         * @param oldValue      The old attribute value
         * @param newValue      The new attribute value
         *
         * @internal
         * @private
         */
        _reflectAttribute(attributeName, oldValue, newValue) {
            const constructor = this.constructor;
            const propertyKey = constructor.attributes.get(attributeName);
            const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
            const propertyValue = propertyDeclaration.converter.fromAttribute(newValue);
            this[propertyKey] = propertyValue;
        }
        /**
         * The default property reflector
         *
         * @remarks
         * If no {@link PropertyReflector} is defined in the {@link PropertyDeclaration} this
         * method is used to reflect the property value to its associated attribute.
         *
         * @param propertyKey   The property key of the property to reflect
         * @param oldValue      The old property value
         * @param newValue      The new property value
         *
         * @internal
         * @private
         */
        _reflectProperty(propertyKey, oldValue, newValue) {
            // this function is only called for properties which have a declaration
            const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
            // TODO: test what happens if attribute is set to false but reflectProperty is true!
            const attributeName = propertyDeclaration.attribute;
            // resolve the attribute value
            const attributeValue = propertyDeclaration.converter.toAttribute(newValue);
            // undefined means don't change
            if (attributeValue === undefined) {
                return;
            }
            // null means remove the attribute
            else if (attributeValue === null) {
                this.removeAttribute(attributeName);
            }
            else {
                this.setAttribute(attributeName, attributeValue);
            }
        }
        /**
         * Dispatch a property-changed event
         *
         * @param propertyKey
         * @param oldValue
         * @param newValue
         */
        _notifyProperty(propertyKey, oldValue, newValue) {
            const eventName = createEventName(propertyKey, '', 'changed');
            this.dispatchEvent(new CustomEvent(eventName, {
                composed: true,
                detail: {
                    property: propertyKey,
                    previous: oldValue,
                    current: newValue
                }
            }));
        }
        /**
         * Dispatch a lifecycle event
         *
         * @param lifecycle The lifecycle for which to raise the event
         * @param detail    Optional event details
         */
        _notifyLifecycle(lifecycle, detail) {
            const eventName = createEventName(lifecycle, 'on');
            const eventInit = Object.assign({ composed: true }, (detail ? { detail: detail } : {}));
            this.dispatchEvent(new CustomEvent(eventName, eventInit));
        }
        /**
         * Bind custom element listeners.
         *
         * @internal
         * @private
         */
        _listen() {
            this.constructor.listeners.forEach((declaration, listener) => {
                const instanceDeclaration = {
                    // copy the class's static listener declaration into an instance listener declaration
                    event: declaration.event,
                    options: declaration.options,
                    // bind the components listener method to the component instance and store it in the instance declaration
                    listener: this[listener].bind(this),
                    // determine the event target and store it in the instance declaration
                    target: (declaration.target) ?
                        (typeof declaration.target === 'function') ?
                            declaration.target() :
                            declaration.target :
                        this
                };
                // add the bound event listener to the target
                instanceDeclaration.target.addEventListener(instanceDeclaration.event, instanceDeclaration.listener, instanceDeclaration.options);
                // save the instance listener declaration on the component instance
                this._listenerDeclarations.push(instanceDeclaration);
            });
        }
        /**
         * Unbind custom element listeners.
         *
         * @internal
         * @private
         */
        _unlisten() {
            this._listenerDeclarations.forEach((declaration) => {
                declaration.target.removeEventListener(declaration.event, declaration.listener, declaration.options);
            });
        }
        /**
         * Schedule the update of the custom element
         *
         * @remarks
         * Schedules the update of the custom element just before the next frame
         * and cleans up the custom elements state afterwards.
         */
        _scheduleUpdate() {
            return new Promise(resolve => {
                // schedule the update via requestAnimationFrame to avoid multiple redraws per frame
                requestAnimationFrame(() => {
                    this.update();
                    this._changedProperties = new Map();
                    this._reflectingProperties = new Map();
                    this._notifyingProperties = new Map();
                    // mark custom element as updated after the update to prevent infinte loops in the update process
                    // N.B.: any property changes during the update will be ignored
                    this._hasRequestedUpdate = false;
                    resolve();
                });
            });
        }
        /**
         * Enqueue a request for an asynchronous update
         */
        async _enqueueUpdate() {
            let resolve;
            const previousRequest = this._updateRequest;
            // mark the custom element as having requested an update, the {@link _requestUpdate} method
            // will not enqueue a further request for update if one is scheduled
            this._hasRequestedUpdate = true;
            this._updateRequest = new Promise(res => resolve = res);
            // wait for the previous update to resolve
            // `await` is asynchronous and will return execution to the {@link requestUpdate} method
            // and essentially allows us to batch multiple synchronous property changes, before the
            // execution can resume here
            await previousRequest;
            const result = this._scheduleUpdate();
            // the actual update is scheduled asynchronously as well
            await result;
            // resolve the new {@link _updateRequest} after the result of the current update resolves
            resolve(!this._hasRequestedUpdate);
        }
        /**
         * Gets the {@link PropertyDeclaration} for a decorated property
         *
         * @param propertyKey The property key for which to retrieve the declaration
         *
         * @internal
         * @private
         */
        _getPropertyDeclaration(propertyKey) {
            return this.constructor.properties.get(propertyKey);
        }
    }
    /**
     * A map of attribute names and their respective property keys
     *
     * @internal
     * @private
     */
    CustomElement.attributes = new Map();
    /**
     * A map of property keys and their respective property declarations
     *
     * @internal
     * @private
     */
    CustomElement.properties = new Map();
    /**
     * A map of property keys and their respective listener declarations
     *
     * @internal
     * @private
     */
    CustomElement.listeners = new Map();

    const DEFAULT_CUSTOM_ELEMENT_DECLARATION = {
        selector: '',
        shadow: true,
        define: true
    };
    /**
     * Decorates a {@link CustomElement} class
     *
     * @param options A custom element declaration
     */
    const customElement = (options = {}) => {
        const declaration = Object.assign({}, DEFAULT_CUSTOM_ELEMENT_DECLARATION, options);
        return (target) => {
            const constructor = target;
            constructor.selector = declaration.selector || target.selector;
            constructor.shadow = declaration.shadow;
            /**
             * Property decorators get called before class decorators, so at this point all decorated properties
             * have stored their associated attributes in {@link CustomElement.attributes}.
             * We can now combine them with the user-defined {@link CustomElement.observedAttributes} and,
             * by using a Set, eliminate all duplicates in the process.
             *
             * As the user-defined {@link CustomElement.observedAttributes} will also include decorator generated
             * observed attributes, we always inherit all observed attributes from a base class. For that reason
             * we have to keep track of attribute overrides when extending any {@link CustomElement} base class.
             * This is done in the {@link property} decorator. Here we have to make sure to remove overridden
             * attributes.
             */
            const observedAttributes = [
                ...new Set(
                // we take the inherited observed attributes...
                constructor.observedAttributes
                    // ...remove overridden generated attributes...
                    .reduce((attributes, attribute) => attributes.concat(constructor.overridden && constructor.overridden.has(attribute) ? [] : attribute), [])
                    // ...and recombine the list with the newly generated attributes (the Set prevents duplicates)
                    .concat([...target.attributes.keys()]))
            ];
            // TODO: delete the overridden Set from the constructor
            /**
             * Finally we override the {@link CustomElement.observedAttributes} getter with a new one, which returns
             * the unique set of user defined and decorator generated observed attributes.
             *
             * N.B.: When extending an existing custom element, and oerriding a property with a different associated
             * attribute name, the base class's original attribute name remains in the {@link CustomElement.observedAttributes}
             * array. Changing the old attribute on the extended class will try to reflect the attribute, but won't
             * find the attribute in the extended class's {@link CustomElement.attributes} Map and will therefore be
             * ignored.
             */
            Reflect.defineProperty(constructor, 'observedAttributes', {
                configurable: true,
                enumerable: false,
                get() {
                    return observedAttributes;
                }
            });
            if (declaration.define) {
                window.customElements.define(constructor.selector, constructor);
            }
        };
    };

    /**
     * Decorates a {@link CustomElement} method as an event listener
     *
     * @param options The listener declaration
     */
    function listener(options) {
        return function (target, propertyKey, descriptor) {
            const constructor = target.constructor;
            prepareConstructor(constructor);
            if (options.event === null) {
                constructor.listeners.delete(propertyKey);
            }
            else {
                constructor.listeners.set(propertyKey, Object.assign({}, options));
            }
        };
    }
    /**
     * Prepares the custom element constructor by initializing static properties for the listener decorator,
     * so we don't modify a base class's static properties.
     *
     * @remarks
     * When the listener decorator stores listener declarations in the constructor, we have to make sure the
     * static listeners field is initialized on the current constructor. Otherwise we add listener declarations
     * to the base class's static field. We also make sure to initialize the listener maps with the values of
     * the base class's map to properly inherit all listener declarations.
     *
     * @param constructor The custom element constructor to prepare
     *
     * @internal
     * @private
     */
    function prepareConstructor(constructor) {
        if (!constructor.hasOwnProperty('listeners'))
            constructor.listeners = new Map(constructor.listeners);
    }

    /**
     * Get the {@link PropertyDescriptor} of a property from its prototype
     * or a parent prototype - excluding {@link Object.prototype} itself, to
     * ensure correct prototype inheritance.
     *
     * @param target        The prototype to get the descriptor from
     * @param propertyKey   The property key for which to get the descriptor
     *
     * @internal
     * @private
     */
    function getPropertyDescriptor(target, propertyKey) {
        if (propertyKey in target) {
            while (target !== Object.prototype) {
                if (target.hasOwnProperty(propertyKey)) {
                    return Object.getOwnPropertyDescriptor(target, propertyKey);
                }
                target = Object.getPrototypeOf(target);
            }
        }
        return undefined;
    }

    /**
     * Decorates a {@link CustomElement} property
     *
     * @remarks
     * Many of the {@link PropertyDeclaration} options support custom functions, which will be invoked
     * with the custom element instance as `this`-context during execution. In order to support correct
     * typing in these functions, the `@property` decorator supports generic types. Here is an example
     * of how you can use this with a custom {@link PropertyReflector}:
     *
     * ```typescript
     * class MyElement extends CustomElement {
     *
     *      myHiddenProperty = true;
     *
     *      // use a generic to support proper instance typing in the property reflector
     *      @property<MyElement>({
     *          reflectProperty: (propertyKey: string, oldValue: any, newValue: any) {
     *              // the generic type allows for correct typing of this
     *              if (this.myHiddenProperty && newValue) {
     *                  this.setAttribute('my-property', '');
     *              } else {
     *                  this.removeAttribute('my-property');
     *              }
     *          }
     *      })
     *      myProperty = false;
     * }
     * ```
     *
     * @param options A property declaration
     */
    const property = (options = {}) => {
        return (target, propertyKey) => {
            const descriptor = getPropertyDescriptor(target, propertyKey);
            const hiddenKey = (typeof propertyKey === 'string') ? `_${propertyKey}` : Symbol();
            const get = descriptor && descriptor.get || function () { return this[hiddenKey]; };
            const set = descriptor && descriptor.set || function (value) { this[hiddenKey] = value; };
            Object.defineProperty(target, propertyKey, {
                configurable: true,
                enumerable: true,
                get() {
                    return get.call(this);
                },
                set(value) {
                    const oldValue = this[propertyKey];
                    set.call(this, value);
                    this.requestUpdate(propertyKey, oldValue, value);
                }
            });
            const constructor = target.constructor;
            const declaration = Object.assign({}, DEFAULT_PROPERTY_DECLARATION, options);
            // generate the default attribute name
            if (declaration.attribute === true) {
                declaration.attribute = createAttributeName(propertyKey);
            }
            // set the default property change detector
            if (declaration.observe === true) {
                declaration.observe = DEFAULT_PROPERTY_DECLARATION.observe;
            }
            prepareConstructor$1(constructor);
            // check if we inherited an observed attribute for the property from the base class
            const attribute = constructor.properties.has(propertyKey) ? constructor.properties.get(propertyKey).attribute : undefined;
            // if attribute is truthy it's a string and it will exist in the attributes map
            if (attribute) {
                // remove the inherited attribute as it's overridden
                constructor.attributes.delete(attribute);
                // mark attribute as overridden for {@link customElement} decorator
                constructor.overridden.add(attribute);
            }
            if (declaration.attribute) {
                constructor.attributes.set(declaration.attribute, propertyKey);
            }
            // store the property declaration last, so we can still access the inherited declaration
            // when processing the attributes
            constructor.properties.set(propertyKey, declaration);
        };
    };
    /**
     * Prepares the custom element constructor by initializing static properties for the property decorator,
     * so we don't modify a base class's static properties.
     *
     * @remarks
     * When the property decorator stores property declarations and attribute mappings in the constructor,
     * we have to make sure those static fields are initialized on the current constructor. Otherwise we
     * add property declarations and attribute mappings to the base class's static fields. We also make
     * sure to initialize the constructors maps with the values of the base class's maps to properly
     * inherit all property declarations and attributes.
     *
     * @param constructor The custom element constructor to prepare
     *
     * @internal
     * @private
     */
    function prepareConstructor$1(constructor) {
        // this will give us a compile-time error if we refactor one of the static constructor properties
        // and we won't miss renaming the property keys
        const properties = 'properties';
        const attributes = 'attributes';
        const overridden = 'overridden';
        if (!constructor.hasOwnProperty(properties))
            constructor.properties = new Map(constructor.properties);
        if (!constructor.hasOwnProperty(attributes))
            constructor.attributes = new Map(constructor.attributes);
        if (!constructor.hasOwnProperty(overridden))
            constructor.overridden = new Set();
    }

    let Checkbox = class Checkbox extends CustomElement {
        constructor() {
            super();
            this.customRole = 'checkbox';
            this.customChecked = false;
        }
        onClick(event) {
            this.watch(() => {
                this.customChecked = !this.customChecked;
            });
            // this.customChecked = !this.customChecked;
            // this.notify('customChecked');
        }
        reflectChecked() {
            if (this.customChecked) {
                this.setAttribute('custom-checked', '');
                this.setAttribute('aria-checked', 'true');
            }
            else {
                this.removeAttribute('custom-checked');
                this.removeAttribute('aria-checked');
            }
        }
        notifyChecked() {
            console.log(`notifyChecked...`);
        }
        template() {
            return html `
            <style>
                :host {
                    display: inline-block;
                    width: 1rem;
                    height: 1rem;
                    border: 1px solid #999;
                }
                :host([custom-checked]) {
                    background-color: #ccc;
                }
            </style>`;
        }
    };
    __decorate([
        property(),
        __metadata("design:type", Object)
    ], Checkbox.prototype, "customRole", void 0);
    __decorate([
        property({
            converter: AttributeConverterBoolean,
            reflectProperty: 'reflectChecked',
            // reflectProperty: function (propertyKey: string, oldValue: any, newValue: any) {
            //     if (this.customChecked) {
            //         this.setAttribute('custom-checked', 'true');
            //         this.setAttribute('aria-checked', 'true');
            //     } else {
            //         this.removeAttribute('custom-checked');
            //         this.removeAttribute('aria-checked');
            //     }
            // },
            // notify: true,
            notify: 'notifyChecked',
        }),
        __metadata("design:type", Object)
    ], Checkbox.prototype, "customChecked", void 0);
    __decorate([
        listener({
            event: 'click'
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [MouseEvent]),
        __metadata("design:returntype", void 0)
    ], Checkbox.prototype, "onClick", null);
    Checkbox = __decorate([
        customElement({
            selector: 'check-box'
        }),
        __metadata("design:paramtypes", [])
    ], Checkbox);

    function bootstrap() {
        const checkbox = document.querySelector('check-box');
        if (checkbox) {
            checkbox.addEventListener('checked-changed', event => console.log(event.detail));
        }
    }
    window.addEventListener('load', bootstrap);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5idW5kbGUuanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saWIvZGlyZWN0aXZlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2xpYi9kb20uanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3BhcnQuanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3RlbXBsYXRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2xpYi90ZW1wbGF0ZS1pbnN0YW5jZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saWIvdGVtcGxhdGUtcmVzdWx0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2xpYi9wYXJ0cy5qcyIsIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saWIvZGVmYXVsdC10ZW1wbGF0ZS1wcm9jZXNzb3IuanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3RlbXBsYXRlLWZhY3RvcnkuanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3JlbmRlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saXQtaHRtbC5qcyIsIi4uL3NyYy91dGlscy9zdHJpbmctdXRpbHMudHMiLCIuLi9zcmMvZGVjb3JhdG9ycy9hdHRyaWJ1dGUtY29udmVydGVyLnRzIiwiLi4vc3JjL2RlY29yYXRvcnMvcHJvcGVydHktZGVjbGFyYXRpb24udHMiLCIuLi9zcmMvY3VzdG9tLWVsZW1lbnQudHMiLCIuLi9zcmMvZGVjb3JhdG9ycy9jdXN0b20tZWxlbWVudC50cyIsIi4uL3NyYy9kZWNvcmF0b3JzL2xpc3RlbmVyLnRzIiwiLi4vc3JjL2RlY29yYXRvcnMvZ2V0LXByb3BlcnR5LWRlc2NyaXB0b3IudHMiLCIuLi9zcmMvZGVjb3JhdG9ycy9wcm9wZXJ0eS50cyIsInNyYy9jaGVja2JveC50cyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuY29uc3QgZGlyZWN0aXZlcyA9IG5ldyBXZWFrTWFwKCk7XG4vKipcbiAqIEJyYW5kcyBhIGZ1bmN0aW9uIGFzIGEgZGlyZWN0aXZlIHNvIHRoYXQgbGl0LWh0bWwgd2lsbCBjYWxsIHRoZSBmdW5jdGlvblxuICogZHVyaW5nIHRlbXBsYXRlIHJlbmRlcmluZywgcmF0aGVyIHRoYW4gcGFzc2luZyBhcyBhIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBmIFRoZSBkaXJlY3RpdmUgZmFjdG9yeSBmdW5jdGlvbi4gTXVzdCBiZSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhXG4gKiBmdW5jdGlvbiBvZiB0aGUgc2lnbmF0dXJlIGAocGFydDogUGFydCkgPT4gdm9pZGAuIFRoZSByZXR1cm5lZCBmdW5jdGlvbiB3aWxsXG4gKiBiZSBjYWxsZWQgd2l0aCB0aGUgcGFydCBvYmplY3RcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYFxuICogaW1wb3J0IHtkaXJlY3RpdmUsIGh0bWx9IGZyb20gJ2xpdC1odG1sJztcbiAqXG4gKiBjb25zdCBpbW11dGFibGUgPSBkaXJlY3RpdmUoKHYpID0+IChwYXJ0KSA9PiB7XG4gKiAgIGlmIChwYXJ0LnZhbHVlICE9PSB2KSB7XG4gKiAgICAgcGFydC5zZXRWYWx1ZSh2KVxuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICovXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5leHBvcnQgY29uc3QgZGlyZWN0aXZlID0gKGYpID0+ICgoLi4uYXJncykgPT4ge1xuICAgIGNvbnN0IGQgPSBmKC4uLmFyZ3MpO1xuICAgIGRpcmVjdGl2ZXMuc2V0KGQsIHRydWUpO1xuICAgIHJldHVybiBkO1xufSk7XG5leHBvcnQgY29uc3QgaXNEaXJlY3RpdmUgPSAobykgPT4ge1xuICAgIHJldHVybiB0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJyAmJiBkaXJlY3RpdmVzLmhhcyhvKTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kaXJlY3RpdmUuanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLyoqXG4gKiBUcnVlIGlmIHRoZSBjdXN0b20gZWxlbWVudHMgcG9seWZpbGwgaXMgaW4gdXNlLlxuICovXG5leHBvcnQgY29uc3QgaXNDRVBvbHlmaWxsID0gd2luZG93LmN1c3RvbUVsZW1lbnRzICE9PSB1bmRlZmluZWQgJiZcbiAgICB3aW5kb3cuY3VzdG9tRWxlbWVudHMucG9seWZpbGxXcmFwRmx1c2hDYWxsYmFjayAhPT1cbiAgICAgICAgdW5kZWZpbmVkO1xuLyoqXG4gKiBSZXBhcmVudHMgbm9kZXMsIHN0YXJ0aW5nIGZyb20gYHN0YXJ0Tm9kZWAgKGluY2x1c2l2ZSkgdG8gYGVuZE5vZGVgXG4gKiAoZXhjbHVzaXZlKSwgaW50byBhbm90aGVyIGNvbnRhaW5lciAoY291bGQgYmUgdGhlIHNhbWUgY29udGFpbmVyKSwgYmVmb3JlXG4gKiBgYmVmb3JlTm9kZWAuIElmIGBiZWZvcmVOb2RlYCBpcyBudWxsLCBpdCBhcHBlbmRzIHRoZSBub2RlcyB0byB0aGVcbiAqIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGFyZW50Tm9kZXMgPSAoY29udGFpbmVyLCBzdGFydCwgZW5kID0gbnVsbCwgYmVmb3JlID0gbnVsbCkgPT4ge1xuICAgIGxldCBub2RlID0gc3RhcnQ7XG4gICAgd2hpbGUgKG5vZGUgIT09IGVuZCkge1xuICAgICAgICBjb25zdCBuID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmUpO1xuICAgICAgICBub2RlID0gbjtcbiAgICB9XG59O1xuLyoqXG4gKiBSZW1vdmVzIG5vZGVzLCBzdGFydGluZyBmcm9tIGBzdGFydE5vZGVgIChpbmNsdXNpdmUpIHRvIGBlbmROb2RlYFxuICogKGV4Y2x1c2l2ZSksIGZyb20gYGNvbnRhaW5lcmAuXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVOb2RlcyA9IChjb250YWluZXIsIHN0YXJ0Tm9kZSwgZW5kTm9kZSA9IG51bGwpID0+IHtcbiAgICBsZXQgbm9kZSA9IHN0YXJ0Tm9kZTtcbiAgICB3aGlsZSAobm9kZSAhPT0gZW5kTm9kZSkge1xuICAgICAgICBjb25zdCBuID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICBub2RlID0gbjtcbiAgICB9XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZG9tLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxOCBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8qKlxuICogQSBzZW50aW5lbCB2YWx1ZSB0aGF0IHNpZ25hbHMgdGhhdCBhIHZhbHVlIHdhcyBoYW5kbGVkIGJ5IGEgZGlyZWN0aXZlIGFuZFxuICogc2hvdWxkIG5vdCBiZSB3cml0dGVuIHRvIHRoZSBET00uXG4gKi9cbmV4cG9ydCBjb25zdCBub0NoYW5nZSA9IHt9O1xuLyoqXG4gKiBBIHNlbnRpbmVsIHZhbHVlIHRoYXQgc2lnbmFscyBhIE5vZGVQYXJ0IHRvIGZ1bGx5IGNsZWFyIGl0cyBjb250ZW50LlxuICovXG5leHBvcnQgY29uc3Qgbm90aGluZyA9IHt9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGFydC5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vKipcbiAqIEFuIGV4cHJlc3Npb24gbWFya2VyIHdpdGggZW1iZWRkZWQgdW5pcXVlIGtleSB0byBhdm9pZCBjb2xsaXNpb24gd2l0aFxuICogcG9zc2libGUgdGV4dCBpbiB0ZW1wbGF0ZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBtYXJrZXIgPSBge3tsaXQtJHtTdHJpbmcoTWF0aC5yYW5kb20oKSkuc2xpY2UoMil9fX1gO1xuLyoqXG4gKiBBbiBleHByZXNzaW9uIG1hcmtlciB1c2VkIHRleHQtcG9zaXRpb25zLCBtdWx0aS1iaW5kaW5nIGF0dHJpYnV0ZXMsIGFuZFxuICogYXR0cmlidXRlcyB3aXRoIG1hcmt1cC1saWtlIHRleHQgdmFsdWVzLlxuICovXG5leHBvcnQgY29uc3Qgbm9kZU1hcmtlciA9IGA8IS0tJHttYXJrZXJ9LS0+YDtcbmV4cG9ydCBjb25zdCBtYXJrZXJSZWdleCA9IG5ldyBSZWdFeHAoYCR7bWFya2VyfXwke25vZGVNYXJrZXJ9YCk7XG4vKipcbiAqIFN1ZmZpeCBhcHBlbmRlZCB0byBhbGwgYm91bmQgYXR0cmlidXRlIG5hbWVzLlxuICovXG5leHBvcnQgY29uc3QgYm91bmRBdHRyaWJ1dGVTdWZmaXggPSAnJGxpdCQnO1xuLyoqXG4gKiBBbiB1cGRhdGVhYmxlIFRlbXBsYXRlIHRoYXQgdHJhY2tzIHRoZSBsb2NhdGlvbiBvZiBkeW5hbWljIHBhcnRzLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGUge1xuICAgIGNvbnN0cnVjdG9yKHJlc3VsdCwgZWxlbWVudCkge1xuICAgICAgICB0aGlzLnBhcnRzID0gW107XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgICBsZXQgcGFydEluZGV4ID0gMDtcbiAgICAgICAgY29uc3Qgbm9kZXNUb1JlbW92ZSA9IFtdO1xuICAgICAgICBjb25zdCBfcHJlcGFyZVRlbXBsYXRlID0gKHRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcbiAgICAgICAgICAgIC8vIEVkZ2UgbmVlZHMgYWxsIDQgcGFyYW1ldGVycyBwcmVzZW50OyBJRTExIG5lZWRzIDNyZCBwYXJhbWV0ZXIgdG8gYmVcbiAgICAgICAgICAgIC8vIG51bGxcbiAgICAgICAgICAgIGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoY29udGVudCwgMTMzIC8qIE5vZGVGaWx0ZXIuU0hPV197RUxFTUVOVHxDT01NRU5UfFRFWFR9ICovLCBudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgbGFzdCBpbmRleCBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0LiBXZSB0cnkgdG8gZGVsZXRlXG4gICAgICAgICAgICAvLyB1bm5lY2Vzc2FyeSBub2RlcywgYnV0IHdlIG5ldmVyIHdhbnQgdG8gYXNzb2NpYXRlIHR3byBkaWZmZXJlbnQgcGFydHNcbiAgICAgICAgICAgIC8vIHRvIHRoZSBzYW1lIGluZGV4LiBUaGV5IG11c3QgaGF2ZSBhIGNvbnN0YW50IG5vZGUgYmV0d2Vlbi5cbiAgICAgICAgICAgIGxldCBsYXN0UGFydEluZGV4ID0gMDtcbiAgICAgICAgICAgIHdoaWxlICh3YWxrZXIubmV4dE5vZGUoKSkge1xuICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHdhbGtlci5jdXJyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAvKiBOb2RlLkVMRU1FTlRfTk9ERSAqLykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5oYXNBdHRyaWJ1dGVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9OYW1lZE5vZGVNYXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGVzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSByZXR1cm5lZCBpbiBkb2N1bWVudCBvcmRlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluIHBhcnRpY3VsYXIsIEVkZ2UvSUUgY2FuIHJldHVybiB0aGVtIG91dCBvZiBvcmRlciwgc28gd2UgY2Fubm90XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgYSBjb3JyZXNwb25kYW5jZSBiZXR3ZWVuIHBhcnQgaW5kZXggYW5kIGF0dHJpYnV0ZSBpbmRleC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlc1tpXS52YWx1ZS5pbmRleE9mKG1hcmtlcikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjb3VudC0tID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgdGVtcGxhdGUgbGl0ZXJhbCBzZWN0aW9uIGxlYWRpbmcgdXAgdG8gdGhlIGZpcnN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhwcmVzc2lvbiBpbiB0aGlzIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0cmluZ0ZvclBhcnQgPSByZXN1bHQuc3RyaW5nc1twYXJ0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGxhc3RBdHRyaWJ1dGVOYW1lUmVnZXguZXhlYyhzdHJpbmdGb3JQYXJ0KVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBjb3JyZXNwb25kaW5nIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBib3VuZCBhdHRyaWJ1dGVzIGhhdmUgaGFkIGEgc3VmZml4IGFkZGVkIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGVtcGxhdGVSZXN1bHQjZ2V0SFRNTCB0byBvcHQgb3V0IG9mIHNwZWNpYWwgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxpbmcuIFRvIGxvb2sgdXAgdGhlIGF0dHJpYnV0ZSB2YWx1ZSB3ZSBhbHNvIG5lZWQgdG8gYWRkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN1ZmZpeC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVMb29rdXBOYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpICsgYm91bmRBdHRyaWJ1dGVTdWZmaXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVMb29rdXBOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHJpbmdzID0gYXR0cmlidXRlVmFsdWUuc3BsaXQobWFya2VyUmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFydHMucHVzaCh7IHR5cGU6ICdhdHRyaWJ1dGUnLCBpbmRleCwgbmFtZSwgc3RyaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVMb29rdXBOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0SW5kZXggKz0gc3RyaW5ncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnRhZ05hbWUgPT09ICdURU1QTEFURScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9wcmVwYXJlVGVtcGxhdGUobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMyAvKiBOb2RlLlRFWFRfTk9ERSAqLykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5pbmRleE9mKG1hcmtlcikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RyaW5ncyA9IGRhdGEuc3BsaXQobWFya2VyUmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gc3RyaW5ncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgYSBuZXcgdGV4dCBub2RlIGZvciBlYWNoIGxpdGVyYWwgc2VjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlc2Ugbm9kZXMgYXJlIGFsc28gdXNlZCBhcyB0aGUgbWFya2VycyBmb3Igbm9kZSBwYXJ0c1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXN0SW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoKHN0cmluZ3NbaV0gPT09ICcnKSA/IGNyZWF0ZU1hcmtlcigpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3RyaW5nc1tpXSksIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFydHMucHVzaCh7IHR5cGU6ICdub2RlJywgaW5kZXg6ICsraW5kZXggfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIHRleHQsIHdlIG11c3QgaW5zZXJ0IGEgY29tbWVudCB0byBtYXJrIG91ciBwbGFjZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIHdlIGNhbiB0cnVzdCBpdCB3aWxsIHN0aWNrIGFyb3VuZCBhZnRlciBjbG9uaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmluZ3NbbGFzdEluZGV4XSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU1hcmtlcigpLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2Rlc1RvUmVtb3ZlLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmRhdGEgPSBzdHJpbmdzW2xhc3RJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgcGFydCBmb3IgZWFjaCBtYXRjaCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFydEluZGV4ICs9IGxhc3RJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIE5vZGUuQ09NTUVOVF9OT0RFICovKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmRhdGEgPT09IG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGEgbmV3IG1hcmtlciBub2RlIHRvIGJlIHRoZSBzdGFydE5vZGUgb2YgdGhlIFBhcnQgaWYgYW55IG9mXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIGFyZSB0cnVlOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICogV2UgZG9uJ3QgaGF2ZSBhIHByZXZpb3VzU2libGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICogVGhlIHByZXZpb3VzU2libGluZyBpcyBhbHJlYWR5IHRoZSBzdGFydCBvZiBhIHByZXZpb3VzIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnByZXZpb3VzU2libGluZyA9PT0gbnVsbCB8fCBpbmRleCA9PT0gbGFzdFBhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShjcmVhdGVNYXJrZXIoKSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0UGFydEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnRzLnB1c2goeyB0eXBlOiAnbm9kZScsIGluZGV4IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIG5leHRTaWJsaW5nLCBrZWVwIHRoaXMgbm9kZSBzbyB3ZSBoYXZlIGFuIGVuZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIHdlIGNhbiByZW1vdmUgaXQgdG8gc2F2ZSBmdXR1cmUgY29zdHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5uZXh0U2libGluZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuZGF0YSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNUb1JlbW92ZS5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LS07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0SW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKGkgPSBub2RlLmRhdGEuaW5kZXhPZihtYXJrZXIsIGkgKyAxKSkgIT09XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21tZW50IG5vZGUgaGFzIGEgYmluZGluZyBtYXJrZXIgaW5zaWRlLCBtYWtlIGFuIGluYWN0aXZlIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgYmluZGluZyB3b24ndCB3b3JrLCBidXQgc3Vic2VxdWVudCBiaW5kaW5ncyB3aWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAoanVzdGluZmFnbmFuaSk6IGNvbnNpZGVyIHdoZXRoZXIgaXQncyBldmVuIHdvcnRoIGl0IHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBiaW5kaW5ncyBpbiBjb21tZW50cyB3b3JrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJ0cy5wdXNoKHsgdHlwZTogJ25vZGUnLCBpbmRleDogLTEgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIF9wcmVwYXJlVGVtcGxhdGUoZWxlbWVudCk7XG4gICAgICAgIC8vIFJlbW92ZSB0ZXh0IGJpbmRpbmcgbm9kZXMgYWZ0ZXIgdGhlIHdhbGsgdG8gbm90IGRpc3R1cmIgdGhlIFRyZWVXYWxrZXJcbiAgICAgICAgZm9yIChjb25zdCBuIG9mIG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgICAgIG4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChuKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBpc1RlbXBsYXRlUGFydEFjdGl2ZSA9IChwYXJ0KSA9PiBwYXJ0LmluZGV4ICE9PSAtMTtcbi8vIEFsbG93cyBgZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJylgIHRvIGJlIHJlbmFtZWQgZm9yIGFcbi8vIHNtYWxsIG1hbnVhbCBzaXplLXNhdmluZ3MuXG5leHBvcnQgY29uc3QgY3JlYXRlTWFya2VyID0gKCkgPT4gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJyk7XG4vKipcbiAqIFRoaXMgcmVnZXggZXh0cmFjdHMgdGhlIGF0dHJpYnV0ZSBuYW1lIHByZWNlZGluZyBhbiBhdHRyaWJ1dGUtcG9zaXRpb25cbiAqIGV4cHJlc3Npb24uIEl0IGRvZXMgdGhpcyBieSBtYXRjaGluZyB0aGUgc3ludGF4IGFsbG93ZWQgZm9yIGF0dHJpYnV0ZXNcbiAqIGFnYWluc3QgdGhlIHN0cmluZyBsaXRlcmFsIGRpcmVjdGx5IHByZWNlZGluZyB0aGUgZXhwcmVzc2lvbiwgYXNzdW1pbmcgdGhhdFxuICogdGhlIGV4cHJlc3Npb24gaXMgaW4gYW4gYXR0cmlidXRlLXZhbHVlIHBvc2l0aW9uLlxuICpcbiAqIFNlZSBhdHRyaWJ1dGVzIGluIHRoZSBIVE1MIHNwZWM6XG4gKiBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0wXG4gKlxuICogXCJcXDAtXFx4MUZcXHg3Ri1cXHg5RlwiIGFyZSBVbmljb2RlIGNvbnRyb2wgY2hhcmFjdGVyc1xuICpcbiAqIFwiIFxceDA5XFx4MGFcXHgwY1xceDBkXCIgYXJlIEhUTUwgc3BhY2UgY2hhcmFjdGVyczpcbiAqIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9pbmZyYXN0cnVjdHVyZS5odG1sI3NwYWNlLWNoYXJhY3RlclxuICpcbiAqIFNvIGFuIGF0dHJpYnV0ZSBpczpcbiAqICAqIFRoZSBuYW1lOiBhbnkgY2hhcmFjdGVyIGV4Y2VwdCBhIGNvbnRyb2wgY2hhcmFjdGVyLCBzcGFjZSBjaGFyYWN0ZXIsICgnKSxcbiAqICAgIChcIiksIFwiPlwiLCBcIj1cIiwgb3IgXCIvXCJcbiAqICAqIEZvbGxvd2VkIGJ5IHplcm8gb3IgbW9yZSBzcGFjZSBjaGFyYWN0ZXJzXG4gKiAgKiBGb2xsb3dlZCBieSBcIj1cIlxuICogICogRm9sbG93ZWQgYnkgemVybyBvciBtb3JlIHNwYWNlIGNoYXJhY3RlcnNcbiAqICAqIEZvbGxvd2VkIGJ5OlxuICogICAgKiBBbnkgY2hhcmFjdGVyIGV4Y2VwdCBzcGFjZSwgKCcpLCAoXCIpLCBcIjxcIiwgXCI+XCIsIFwiPVwiLCAoYCksIG9yXG4gKiAgICAqIChcIikgdGhlbiBhbnkgbm9uLShcIiksIG9yXG4gKiAgICAqICgnKSB0aGVuIGFueSBub24tKCcpXG4gKi9cbmV4cG9ydCBjb25zdCBsYXN0QXR0cmlidXRlTmFtZVJlZ2V4ID0gLyhbIFxceDA5XFx4MGFcXHgwY1xceDBkXSkoW15cXDAtXFx4MUZcXHg3Ri1cXHg5RiBcXHgwOVxceDBhXFx4MGNcXHgwZFwiJz49L10rKShbIFxceDA5XFx4MGFcXHgwY1xceDBkXSo9WyBcXHgwOVxceDBhXFx4MGNcXHgwZF0qKD86W14gXFx4MDlcXHgwYVxceDBjXFx4MGRcIidgPD49XSp8XCJbXlwiXSp8J1teJ10qKSkkLztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNyBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8qKlxuICogQG1vZHVsZSBsaXQtaHRtbFxuICovXG5pbXBvcnQgeyBpc0NFUG9seWZpbGwgfSBmcm9tICcuL2RvbS5qcyc7XG5pbXBvcnQgeyBpc1RlbXBsYXRlUGFydEFjdGl2ZSB9IGZyb20gJy4vdGVtcGxhdGUuanMnO1xuLyoqXG4gKiBBbiBpbnN0YW5jZSBvZiBhIGBUZW1wbGF0ZWAgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIERPTSBhbmQgdXBkYXRlZFxuICogd2l0aCBuZXcgdmFsdWVzLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVJbnN0YW5jZSB7XG4gICAgY29uc3RydWN0b3IodGVtcGxhdGUsIHByb2Nlc3Nvciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9wYXJ0cyA9IFtdO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIHRoaXMucHJvY2Vzc29yID0gcHJvY2Vzc29yO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH1cbiAgICB1cGRhdGUodmFsdWVzKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHRoaXMuX3BhcnRzKSB7XG4gICAgICAgICAgICBpZiAocGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGFydC5zZXRWYWx1ZSh2YWx1ZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiB0aGlzLl9wYXJ0cykge1xuICAgICAgICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBhcnQuY29tbWl0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2Nsb25lKCkge1xuICAgICAgICAvLyBXaGVuIHVzaW5nIHRoZSBDdXN0b20gRWxlbWVudHMgcG9seWZpbGwsIGNsb25lIHRoZSBub2RlLCByYXRoZXIgdGhhblxuICAgICAgICAvLyBpbXBvcnRpbmcgaXQsIHRvIGtlZXAgdGhlIGZyYWdtZW50IGluIHRoZSB0ZW1wbGF0ZSdzIGRvY3VtZW50LiBUaGlzXG4gICAgICAgIC8vIGxlYXZlcyB0aGUgZnJhZ21lbnQgaW5lcnQgc28gY3VzdG9tIGVsZW1lbnRzIHdvbid0IHVwZ3JhZGUgYW5kXG4gICAgICAgIC8vIHBvdGVudGlhbGx5IG1vZGlmeSB0aGVpciBjb250ZW50cyBieSBjcmVhdGluZyBhIHBvbHlmaWxsZWQgU2hhZG93Um9vdFxuICAgICAgICAvLyB3aGlsZSB3ZSB0cmF2ZXJzZSB0aGUgdHJlZS5cbiAgICAgICAgY29uc3QgZnJhZ21lbnQgPSBpc0NFUG9seWZpbGwgP1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZS5lbGVtZW50LmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIDpcbiAgICAgICAgICAgIGRvY3VtZW50LmltcG9ydE5vZGUodGhpcy50ZW1wbGF0ZS5lbGVtZW50LmNvbnRlbnQsIHRydWUpO1xuICAgICAgICBjb25zdCBwYXJ0cyA9IHRoaXMudGVtcGxhdGUucGFydHM7XG4gICAgICAgIGxldCBwYXJ0SW5kZXggPSAwO1xuICAgICAgICBsZXQgbm9kZUluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgX3ByZXBhcmVJbnN0YW5jZSA9IChmcmFnbWVudCkgPT4ge1xuICAgICAgICAgICAgLy8gRWRnZSBuZWVkcyBhbGwgNCBwYXJhbWV0ZXJzIHByZXNlbnQ7IElFMTEgbmVlZHMgM3JkIHBhcmFtZXRlciB0byBiZVxuICAgICAgICAgICAgLy8gbnVsbFxuICAgICAgICAgICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihmcmFnbWVudCwgMTMzIC8qIE5vZGVGaWx0ZXIuU0hPV197RUxFTUVOVHxDT01NRU5UfFRFWFR9ICovLCBudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICBsZXQgbm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgbm9kZXMgYW5kIHBhcnRzIG9mIGEgdGVtcGxhdGVcbiAgICAgICAgICAgIHdoaWxlIChwYXJ0SW5kZXggPCBwYXJ0cy5sZW5ndGggJiYgbm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1twYXJ0SW5kZXhdO1xuICAgICAgICAgICAgICAgIC8vIENvbnNlY3V0aXZlIFBhcnRzIG1heSBoYXZlIHRoZSBzYW1lIG5vZGUgaW5kZXgsIGluIHRoZSBjYXNlIG9mXG4gICAgICAgICAgICAgICAgLy8gbXVsdGlwbGUgYm91bmQgYXR0cmlidXRlcyBvbiBhbiBlbGVtZW50LiBTbyBlYWNoIGl0ZXJhdGlvbiB3ZSBlaXRoZXJcbiAgICAgICAgICAgICAgICAvLyBpbmNyZW1lbnQgdGhlIG5vZGVJbmRleCwgaWYgd2UgYXJlbid0IG9uIGEgbm9kZSB3aXRoIGEgcGFydCwgb3IgdGhlXG4gICAgICAgICAgICAgICAgLy8gcGFydEluZGV4IGlmIHdlIGFyZS4gQnkgbm90IGluY3JlbWVudGluZyB0aGUgbm9kZUluZGV4IHdoZW4gd2UgZmluZCBhXG4gICAgICAgICAgICAgICAgLy8gcGFydCwgd2UgYWxsb3cgZm9yIHRoZSBuZXh0IHBhcnQgdG8gYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50XG4gICAgICAgICAgICAgICAgLy8gbm9kZSBpZiBuZWNjZXNzYXNyeS5cbiAgICAgICAgICAgICAgICBpZiAoIWlzVGVtcGxhdGVQYXJ0QWN0aXZlKHBhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcnRzLnB1c2godW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgcGFydEluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vZGVJbmRleCA9PT0gcGFydC5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFydC50eXBlID09PSAnbm9kZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnQgPSB0aGlzLnByb2Nlc3Nvci5oYW5kbGVUZXh0RXhwcmVzc2lvbih0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydC5pbnNlcnRBZnRlck5vZGUobm9kZS5wcmV2aW91c1NpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFydHMucHVzaChwYXJ0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcnRzLnB1c2goLi4udGhpcy5wcm9jZXNzb3IuaGFuZGxlQXR0cmlidXRlRXhwcmVzc2lvbnMobm9kZSwgcGFydC5uYW1lLCBwYXJ0LnN0cmluZ3MsIHRoaXMub3B0aW9ucykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhcnRJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSAnVEVNUExBVEUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcHJlcGFyZUluc3RhbmNlKG5vZGUuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgX3ByZXBhcmVJbnN0YW5jZShmcmFnbWVudCk7XG4gICAgICAgIGlmIChpc0NFUG9seWZpbGwpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkb3B0Tm9kZShmcmFnbWVudCk7XG4gICAgICAgICAgICBjdXN0b21FbGVtZW50cy51cGdyYWRlKGZyYWdtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnJhZ21lbnQ7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGVtcGxhdGUtaW5zdGFuY2UuanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLyoqXG4gKiBAbW9kdWxlIGxpdC1odG1sXG4gKi9cbmltcG9ydCB7IHJlcGFyZW50Tm9kZXMgfSBmcm9tICcuL2RvbS5qcyc7XG5pbXBvcnQgeyBib3VuZEF0dHJpYnV0ZVN1ZmZpeCwgbGFzdEF0dHJpYnV0ZU5hbWVSZWdleCwgbWFya2VyLCBub2RlTWFya2VyIH0gZnJvbSAnLi90ZW1wbGF0ZS5qcyc7XG4vKipcbiAqIFRoZSByZXR1cm4gdHlwZSBvZiBgaHRtbGAsIHdoaWNoIGhvbGRzIGEgVGVtcGxhdGUgYW5kIHRoZSB2YWx1ZXMgZnJvbVxuICogaW50ZXJwb2xhdGVkIGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVSZXN1bHQge1xuICAgIGNvbnN0cnVjdG9yKHN0cmluZ3MsIHZhbHVlcywgdHlwZSwgcHJvY2Vzc29yKSB7XG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLnByb2Nlc3NvciA9IHByb2Nlc3NvcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHN0cmluZyBvZiBIVE1MIHVzZWQgdG8gY3JlYXRlIGEgYDx0ZW1wbGF0ZT5gIGVsZW1lbnQuXG4gICAgICovXG4gICAgZ2V0SFRNTCgpIHtcbiAgICAgICAgY29uc3QgZW5kSW5kZXggPSB0aGlzLnN0cmluZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmRJbmRleDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBzID0gdGhpcy5zdHJpbmdzW2ldO1xuICAgICAgICAgICAgLy8gVGhpcyBleGVjKCkgY2FsbCBkb2VzIHR3byB0aGluZ3M6XG4gICAgICAgICAgICAvLyAxKSBBcHBlbmRzIGEgc3VmZml4IHRvIHRoZSBib3VuZCBhdHRyaWJ1dGUgbmFtZSB0byBvcHQgb3V0IG9mIHNwZWNpYWxcbiAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSB2YWx1ZSBwYXJzaW5nIHRoYXQgSUUxMSBhbmQgRWRnZSBkbywgbGlrZSBmb3Igc3R5bGUgYW5kXG4gICAgICAgICAgICAvLyBtYW55IFNWRyBhdHRyaWJ1dGVzLiBUaGUgVGVtcGxhdGUgY2xhc3MgYWxzbyBhcHBlbmRzIHRoZSBzYW1lIHN1ZmZpeFxuICAgICAgICAgICAgLy8gd2hlbiBsb29raW5nIHVwIGF0dHJpYnV0ZXMgdG8gY3JlYXRlIFBhcnRzLlxuICAgICAgICAgICAgLy8gMikgQWRkcyBhbiB1bnF1b3RlZC1hdHRyaWJ1dGUtc2FmZSBtYXJrZXIgZm9yIHRoZSBmaXJzdCBleHByZXNzaW9uIGluXG4gICAgICAgICAgICAvLyBhbiBhdHRyaWJ1dGUuIFN1YnNlcXVlbnQgYXR0cmlidXRlIGV4cHJlc3Npb25zIHdpbGwgdXNlIG5vZGUgbWFya2VycyxcbiAgICAgICAgICAgIC8vIGFuZCB0aGlzIGlzIHNhZmUgc2luY2UgYXR0cmlidXRlcyB3aXRoIG11bHRpcGxlIGV4cHJlc3Npb25zIGFyZVxuICAgICAgICAgICAgLy8gZ3VhcmFudGVlZCB0byBiZSBxdW90ZWQuXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IGxhc3RBdHRyaWJ1dGVOYW1lUmVnZXguZXhlYyhzKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIC8vIFdlJ3JlIHN0YXJ0aW5nIGEgbmV3IGJvdW5kIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIHNhZmUgYXR0cmlidXRlIHN1ZmZpeCwgYW5kIHVzZSB1bnF1b3RlZC1hdHRyaWJ1dGUtc2FmZVxuICAgICAgICAgICAgICAgIC8vIG1hcmtlci5cbiAgICAgICAgICAgICAgICBodG1sICs9IHMuc3Vic3RyKDAsIG1hdGNoLmluZGV4KSArIG1hdGNoWzFdICsgbWF0Y2hbMl0gK1xuICAgICAgICAgICAgICAgICAgICBib3VuZEF0dHJpYnV0ZVN1ZmZpeCArIG1hdGNoWzNdICsgbWFya2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UncmUgZWl0aGVyIGluIGEgYm91bmQgbm9kZSwgb3IgdHJhaWxpbmcgYm91bmQgYXR0cmlidXRlLlxuICAgICAgICAgICAgICAgIC8vIEVpdGhlciB3YXksIG5vZGVNYXJrZXIgaXMgc2FmZSB0byB1c2UuXG4gICAgICAgICAgICAgICAgaHRtbCArPSBzICsgbm9kZU1hcmtlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaHRtbCArIHRoaXMuc3RyaW5nc1tlbmRJbmRleF07XG4gICAgfVxuICAgIGdldFRlbXBsYXRlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmdldEhUTUwoKTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cbn1cbi8qKlxuICogQSBUZW1wbGF0ZVJlc3VsdCBmb3IgU1ZHIGZyYWdtZW50cy5cbiAqXG4gKiBUaGlzIGNsYXNzIHdyYXBzIEhUTWwgaW4gYW4gYDxzdmc+YCB0YWcgaW4gb3JkZXIgdG8gcGFyc2UgaXRzIGNvbnRlbnRzIGluIHRoZVxuICogU1ZHIG5hbWVzcGFjZSwgdGhlbiBtb2RpZmllcyB0aGUgdGVtcGxhdGUgdG8gcmVtb3ZlIHRoZSBgPHN2Zz5gIHRhZyBzbyB0aGF0XG4gKiBjbG9uZXMgb25seSBjb250YWluZXIgdGhlIG9yaWdpbmFsIGZyYWdtZW50LlxuICovXG5leHBvcnQgY2xhc3MgU1ZHVGVtcGxhdGVSZXN1bHQgZXh0ZW5kcyBUZW1wbGF0ZVJlc3VsdCB7XG4gICAgZ2V0SFRNTCgpIHtcbiAgICAgICAgcmV0dXJuIGA8c3ZnPiR7c3VwZXIuZ2V0SFRNTCgpfTwvc3ZnPmA7XG4gICAgfVxuICAgIGdldFRlbXBsYXRlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBzdXBlci5nZXRUZW1wbGF0ZUVsZW1lbnQoKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9IHRlbXBsYXRlLmNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IHN2Z0VsZW1lbnQgPSBjb250ZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgIGNvbnRlbnQucmVtb3ZlQ2hpbGQoc3ZnRWxlbWVudCk7XG4gICAgICAgIHJlcGFyZW50Tm9kZXMoY29udGVudCwgc3ZnRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLXJlc3VsdC5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vKipcbiAqIEBtb2R1bGUgbGl0LWh0bWxcbiAqL1xuaW1wb3J0IHsgaXNEaXJlY3RpdmUgfSBmcm9tICcuL2RpcmVjdGl2ZS5qcyc7XG5pbXBvcnQgeyByZW1vdmVOb2RlcyB9IGZyb20gJy4vZG9tLmpzJztcbmltcG9ydCB7IG5vQ2hhbmdlLCBub3RoaW5nIH0gZnJvbSAnLi9wYXJ0LmpzJztcbmltcG9ydCB7IFRlbXBsYXRlSW5zdGFuY2UgfSBmcm9tICcuL3RlbXBsYXRlLWluc3RhbmNlLmpzJztcbmltcG9ydCB7IFRlbXBsYXRlUmVzdWx0IH0gZnJvbSAnLi90ZW1wbGF0ZS1yZXN1bHQuanMnO1xuaW1wb3J0IHsgY3JlYXRlTWFya2VyIH0gZnJvbSAnLi90ZW1wbGF0ZS5qcyc7XG5leHBvcnQgY29uc3QgaXNQcmltaXRpdmUgPSAodmFsdWUpID0+IHtcbiAgICByZXR1cm4gKHZhbHVlID09PSBudWxsIHx8XG4gICAgICAgICEodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpKTtcbn07XG4vKipcbiAqIFNldHMgYXR0cmlidXRlIHZhbHVlcyBmb3IgQXR0cmlidXRlUGFydHMsIHNvIHRoYXQgdGhlIHZhbHVlIGlzIG9ubHkgc2V0IG9uY2VcbiAqIGV2ZW4gaWYgdGhlcmUgYXJlIG11bHRpcGxlIHBhcnRzIGZvciBhbiBhdHRyaWJ1dGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBBdHRyaWJ1dGVDb21taXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MpIHtcbiAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XG4gICAgICAgIHRoaXMucGFydHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJpbmdzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJ0c1tpXSA9IHRoaXMuX2NyZWF0ZVBhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc2luZ2xlIHBhcnQuIE92ZXJyaWRlIHRoaXMgdG8gY3JlYXRlIGEgZGlmZmVybnQgdHlwZSBvZiBwYXJ0LlxuICAgICAqL1xuICAgIF9jcmVhdGVQYXJ0KCkge1xuICAgICAgICByZXR1cm4gbmV3IEF0dHJpYnV0ZVBhcnQodGhpcyk7XG4gICAgfVxuICAgIF9nZXRWYWx1ZSgpIHtcbiAgICAgICAgY29uc3Qgc3RyaW5ncyA9IHRoaXMuc3RyaW5ncztcbiAgICAgICAgY29uc3QgbCA9IHN0cmluZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgbGV0IHRleHQgPSAnJztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRleHQgKz0gc3RyaW5nc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnQgPSB0aGlzLnBhcnRzW2ldO1xuICAgICAgICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBwYXJ0LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2ICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgKEFycmF5LmlzQXJyYXkodikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB2ICE9PSAnc3RyaW5nJyAmJiB2W1N5bWJvbC5pdGVyYXRvcl0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdCBvZiB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHQgOiBTdHJpbmcodCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgKz0gdHlwZW9mIHYgPT09ICdzdHJpbmcnID8gdiA6IFN0cmluZyh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGV4dCArPSBzdHJpbmdzW2xdO1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG4gICAgY29tbWl0KCkge1xuICAgICAgICBpZiAodGhpcy5kaXJ0eSkge1xuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLm5hbWUsIHRoaXMuX2dldFZhbHVlKCkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZVBhcnQge1xuICAgIGNvbnN0cnVjdG9yKGNvbWl0dGVyKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY29tbWl0dGVyID0gY29taXR0ZXI7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbm9DaGFuZ2UgJiYgKCFpc1ByaW1pdGl2ZSh2YWx1ZSkgfHwgdmFsdWUgIT09IHRoaXMudmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYSBub3QgYSBkaXJlY3RpdmUsIGRpcnR5IHRoZSBjb21taXR0ZXIgc28gdGhhdCBpdCdsbFxuICAgICAgICAgICAgLy8gY2FsbCBzZXRBdHRyaWJ1dGUuIElmIHRoZSB2YWx1ZSBpcyBhIGRpcmVjdGl2ZSwgaXQnbGwgZGlydHkgdGhlXG4gICAgICAgICAgICAvLyBjb21taXR0ZXIgaWYgaXQgY2FsbHMgc2V0VmFsdWUoKS5cbiAgICAgICAgICAgIGlmICghaXNEaXJlY3RpdmUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21taXR0ZXIuZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgd2hpbGUgKGlzRGlyZWN0aXZlKHRoaXMudmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG5vQ2hhbmdlO1xuICAgICAgICAgICAgZGlyZWN0aXZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZhbHVlID09PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tbWl0dGVyLmNvbW1pdCgpO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBOb2RlUGFydCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluc2VydHMgdGhpcyBwYXJ0IGludG8gYSBjb250YWluZXIuXG4gICAgICpcbiAgICAgKiBUaGlzIHBhcnQgbXVzdCBiZSBlbXB0eSwgYXMgaXRzIGNvbnRlbnRzIGFyZSBub3QgYXV0b21hdGljYWxseSBtb3ZlZC5cbiAgICAgKi9cbiAgICBhcHBlbmRJbnRvKGNvbnRhaW5lcikge1xuICAgICAgICB0aGlzLnN0YXJ0Tm9kZSA9IGNvbnRhaW5lci5hcHBlbmRDaGlsZChjcmVhdGVNYXJrZXIoKSk7XG4gICAgICAgIHRoaXMuZW5kTm9kZSA9IGNvbnRhaW5lci5hcHBlbmRDaGlsZChjcmVhdGVNYXJrZXIoKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluc2VydHMgdGhpcyBwYXJ0IGJldHdlZW4gYHJlZmAgYW5kIGByZWZgJ3MgbmV4dCBzaWJsaW5nLiBCb3RoIGByZWZgIGFuZFxuICAgICAqIGl0cyBuZXh0IHNpYmxpbmcgbXVzdCBiZSBzdGF0aWMsIHVuY2hhbmdpbmcgbm9kZXMgc3VjaCBhcyB0aG9zZSB0aGF0IGFwcGVhclxuICAgICAqIGluIGEgbGl0ZXJhbCBzZWN0aW9uIG9mIGEgdGVtcGxhdGUuXG4gICAgICpcbiAgICAgKiBUaGlzIHBhcnQgbXVzdCBiZSBlbXB0eSwgYXMgaXRzIGNvbnRlbnRzIGFyZSBub3QgYXV0b21hdGljYWxseSBtb3ZlZC5cbiAgICAgKi9cbiAgICBpbnNlcnRBZnRlck5vZGUocmVmKSB7XG4gICAgICAgIHRoaXMuc3RhcnROb2RlID0gcmVmO1xuICAgICAgICB0aGlzLmVuZE5vZGUgPSByZWYubmV4dFNpYmxpbmc7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgdGhpcyBwYXJ0IGludG8gYSBwYXJlbnQgcGFydC5cbiAgICAgKlxuICAgICAqIFRoaXMgcGFydCBtdXN0IGJlIGVtcHR5LCBhcyBpdHMgY29udGVudHMgYXJlIG5vdCBhdXRvbWF0aWNhbGx5IG1vdmVkLlxuICAgICAqL1xuICAgIGFwcGVuZEludG9QYXJ0KHBhcnQpIHtcbiAgICAgICAgcGFydC5faW5zZXJ0KHRoaXMuc3RhcnROb2RlID0gY3JlYXRlTWFya2VyKCkpO1xuICAgICAgICBwYXJ0Ll9pbnNlcnQodGhpcy5lbmROb2RlID0gY3JlYXRlTWFya2VyKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIHRoaXMgcGFydCBhZnRlciBgcmVmYFxuICAgICAqXG4gICAgICogVGhpcyBwYXJ0IG11c3QgYmUgZW1wdHksIGFzIGl0cyBjb250ZW50cyBhcmUgbm90IGF1dG9tYXRpY2FsbHkgbW92ZWQuXG4gICAgICovXG4gICAgaW5zZXJ0QWZ0ZXJQYXJ0KHJlZikge1xuICAgICAgICByZWYuX2luc2VydCh0aGlzLnN0YXJ0Tm9kZSA9IGNyZWF0ZU1hcmtlcigpKTtcbiAgICAgICAgdGhpcy5lbmROb2RlID0gcmVmLmVuZE5vZGU7XG4gICAgICAgIHJlZi5lbmROb2RlID0gdGhpcy5zdGFydE5vZGU7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBjb21taXQoKSB7XG4gICAgICAgIHdoaWxlIChpc0RpcmVjdGl2ZSh0aGlzLl9wZW5kaW5nVmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLl9wZW5kaW5nVmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSBub0NoYW5nZTtcbiAgICAgICAgICAgIGRpcmVjdGl2ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX3BlbmRpbmdWYWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlID09PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ByaW1pdGl2ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdGhpcy52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRleHQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgVGVtcGxhdGVSZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRlbXBsYXRlUmVzdWx0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgICAgICB2YWx1ZVtTeW1ib2wuaXRlcmF0b3JdKSB7XG4gICAgICAgICAgICB0aGlzLl9jb21taXRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IG5vdGhpbmcpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBub3RoaW5nO1xuICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2ssIHdpbGwgcmVuZGVyIHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb25cbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRleHQodmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9pbnNlcnQobm9kZSkge1xuICAgICAgICB0aGlzLmVuZE5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgdGhpcy5lbmROb2RlKTtcbiAgICB9XG4gICAgX2NvbW1pdE5vZGUodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9pbnNlcnQodmFsdWUpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIF9jb21taXRUZXh0KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZS5uZXh0U2libGluZztcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMuZW5kTm9kZS5wcmV2aW91c1NpYmxpbmcgJiZcbiAgICAgICAgICAgIG5vZGUubm9kZVR5cGUgPT09IDMgLyogTm9kZS5URVhUX05PREUgKi8pIHtcbiAgICAgICAgICAgIC8vIElmIHdlIG9ubHkgaGF2ZSBhIHNpbmdsZSB0ZXh0IG5vZGUgYmV0d2VlbiB0aGUgbWFya2Vycywgd2UgY2FuIGp1c3RcbiAgICAgICAgICAgIC8vIHNldCBpdHMgdmFsdWUsIHJhdGhlciB0aGFuIHJlcGxhY2luZyBpdC5cbiAgICAgICAgICAgIC8vIFRPRE8oanVzdGluZmFnbmFuaSk6IENhbiB3ZSBqdXN0IGNoZWNrIGlmIHRoaXMudmFsdWUgaXMgcHJpbWl0aXZlP1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jb21taXROb2RlKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IFN0cmluZyh2YWx1ZSkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIF9jb21taXRUZW1wbGF0ZVJlc3VsdCh2YWx1ZSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZUZhY3RvcnkodmFsdWUpO1xuICAgICAgICBpZiAodGhpcy52YWx1ZSBpbnN0YW5jZW9mIFRlbXBsYXRlSW5zdGFuY2UgJiZcbiAgICAgICAgICAgIHRoaXMudmFsdWUudGVtcGxhdGUgPT09IHRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlLnVwZGF0ZSh2YWx1ZS52YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHdlIHByb3BhZ2F0ZSB0aGUgdGVtcGxhdGUgcHJvY2Vzc29yIGZyb20gdGhlIFRlbXBsYXRlUmVzdWx0XG4gICAgICAgICAgICAvLyBzbyB0aGF0IHdlIHVzZSBpdHMgc3ludGF4IGV4dGVuc2lvbiwgZXRjLiBUaGUgdGVtcGxhdGUgZmFjdG9yeSBjb21lc1xuICAgICAgICAgICAgLy8gZnJvbSB0aGUgcmVuZGVyIGZ1bmN0aW9uIG9wdGlvbnMgc28gdGhhdCBpdCBjYW4gY29udHJvbCB0ZW1wbGF0ZVxuICAgICAgICAgICAgLy8gY2FjaGluZyBhbmQgcHJlcHJvY2Vzc2luZy5cbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IFRlbXBsYXRlSW5zdGFuY2UodGVtcGxhdGUsIHZhbHVlLnByb2Nlc3NvciwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGZyYWdtZW50ID0gaW5zdGFuY2UuX2Nsb25lKCk7XG4gICAgICAgICAgICBpbnN0YW5jZS51cGRhdGUodmFsdWUudmFsdWVzKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUoZnJhZ21lbnQpO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9jb21taXRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgICAvLyBGb3IgYW4gSXRlcmFibGUsIHdlIGNyZWF0ZSBhIG5ldyBJbnN0YW5jZVBhcnQgcGVyIGl0ZW0sIHRoZW4gc2V0IGl0c1xuICAgICAgICAvLyB2YWx1ZSB0byB0aGUgaXRlbS4gVGhpcyBpcyBhIGxpdHRsZSBiaXQgb2Ygb3ZlcmhlYWQgZm9yIGV2ZXJ5IGl0ZW0gaW5cbiAgICAgICAgLy8gYW4gSXRlcmFibGUsIGJ1dCBpdCBsZXRzIHVzIHJlY3Vyc2UgZWFzaWx5IGFuZCBlZmZpY2llbnRseSB1cGRhdGUgQXJyYXlzXG4gICAgICAgIC8vIG9mIFRlbXBsYXRlUmVzdWx0cyB0aGF0IHdpbGwgYmUgY29tbW9ubHkgcmV0dXJuZWQgZnJvbSBleHByZXNzaW9ucyBsaWtlOlxuICAgICAgICAvLyBhcnJheS5tYXAoKGkpID0+IGh0bWxgJHtpfWApLCBieSByZXVzaW5nIGV4aXN0aW5nIFRlbXBsYXRlSW5zdGFuY2VzLlxuICAgICAgICAvLyBJZiBfdmFsdWUgaXMgYW4gYXJyYXksIHRoZW4gdGhlIHByZXZpb3VzIHJlbmRlciB3YXMgb2YgYW5cbiAgICAgICAgLy8gaXRlcmFibGUgYW5kIF92YWx1ZSB3aWxsIGNvbnRhaW4gdGhlIE5vZGVQYXJ0cyBmcm9tIHRoZSBwcmV2aW91c1xuICAgICAgICAvLyByZW5kZXIuIElmIF92YWx1ZSBpcyBub3QgYW4gYXJyYXksIGNsZWFyIHRoaXMgcGFydCBhbmQgbWFrZSBhIG5ld1xuICAgICAgICAvLyBhcnJheSBmb3IgTm9kZVBhcnRzLlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy52YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBMZXRzIHVzIGtlZXAgdHJhY2sgb2YgaG93IG1hbnkgaXRlbXMgd2Ugc3RhbXBlZCBzbyB3ZSBjYW4gY2xlYXIgbGVmdG92ZXJcbiAgICAgICAgLy8gaXRlbXMgZnJvbSBhIHByZXZpb3VzIHJlbmRlclxuICAgICAgICBjb25zdCBpdGVtUGFydHMgPSB0aGlzLnZhbHVlO1xuICAgICAgICBsZXQgcGFydEluZGV4ID0gMDtcbiAgICAgICAgbGV0IGl0ZW1QYXJ0O1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFRyeSB0byByZXVzZSBhbiBleGlzdGluZyBwYXJ0XG4gICAgICAgICAgICBpdGVtUGFydCA9IGl0ZW1QYXJ0c1twYXJ0SW5kZXhdO1xuICAgICAgICAgICAgLy8gSWYgbm8gZXhpc3RpbmcgcGFydCwgY3JlYXRlIGEgbmV3IG9uZVxuICAgICAgICAgICAgaWYgKGl0ZW1QYXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpdGVtUGFydCA9IG5ldyBOb2RlUGFydCh0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGl0ZW1QYXJ0cy5wdXNoKGl0ZW1QYXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAocGFydEluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1QYXJ0LmFwcGVuZEludG9QYXJ0KHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbVBhcnQuaW5zZXJ0QWZ0ZXJQYXJ0KGl0ZW1QYXJ0c1twYXJ0SW5kZXggLSAxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlbVBhcnQuc2V0VmFsdWUoaXRlbSk7XG4gICAgICAgICAgICBpdGVtUGFydC5jb21taXQoKTtcbiAgICAgICAgICAgIHBhcnRJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0SW5kZXggPCBpdGVtUGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBUcnVuY2F0ZSB0aGUgcGFydHMgYXJyYXkgc28gX3ZhbHVlIHJlZmxlY3RzIHRoZSBjdXJyZW50IHN0YXRlXG4gICAgICAgICAgICBpdGVtUGFydHMubGVuZ3RoID0gcGFydEluZGV4O1xuICAgICAgICAgICAgdGhpcy5jbGVhcihpdGVtUGFydCAmJiBpdGVtUGFydC5lbmROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbGVhcihzdGFydE5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSkge1xuICAgICAgICByZW1vdmVOb2Rlcyh0aGlzLnN0YXJ0Tm9kZS5wYXJlbnROb2RlLCBzdGFydE5vZGUubmV4dFNpYmxpbmcsIHRoaXMuZW5kTm9kZSk7XG4gICAgfVxufVxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgYm9vbGVhbiBhdHRyaWJ1dGUsIHJvdWdobHkgYXMgZGVmaW5lZCBpbiB0aGUgSFRNTFxuICogc3BlY2lmaWNhdGlvbi5cbiAqXG4gKiBJZiB0aGUgdmFsdWUgaXMgdHJ1dGh5LCB0aGVuIHRoZSBhdHRyaWJ1dGUgaXMgcHJlc2VudCB3aXRoIGEgdmFsdWUgb2ZcbiAqICcnLiBJZiB0aGUgdmFsdWUgaXMgZmFsc2V5LCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb29sZWFuQXR0cmlidXRlUGFydCB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgbmFtZSwgc3RyaW5ncykge1xuICAgICAgICB0aGlzLnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChzdHJpbmdzLmxlbmd0aCAhPT0gMiB8fCBzdHJpbmdzWzBdICE9PSAnJyB8fCBzdHJpbmdzWzFdICE9PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb29sZWFuIGF0dHJpYnV0ZXMgY2FuIG9ubHkgY29udGFpbiBhIHNpbmdsZSBleHByZXNzaW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcbiAgICB9XG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1ZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgd2hpbGUgKGlzRGlyZWN0aXZlKHRoaXMuX3BlbmRpbmdWYWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMuX3BlbmRpbmdWYWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IG5vQ2hhbmdlO1xuICAgICAgICAgICAgZGlyZWN0aXZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wZW5kaW5nVmFsdWUgPT09IG5vQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSAhIXRoaXMuX3BlbmRpbmdWYWx1ZTtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMubmFtZSwgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSh0aGlzLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1ZhbHVlID0gbm9DaGFuZ2U7XG4gICAgfVxufVxuLyoqXG4gKiBTZXRzIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIFByb3BlcnR5UGFydHMsIHNvIHRoYXQgdGhlIHZhbHVlIGlzIG9ubHkgc2V0IG9uY2VcbiAqIGV2ZW4gaWYgdGhlcmUgYXJlIG11bHRpcGxlIHBhcnRzIGZvciBhIHByb3BlcnR5LlxuICpcbiAqIElmIGFuIGV4cHJlc3Npb24gY29udHJvbHMgdGhlIHdob2xlIHByb3BlcnR5IHZhbHVlLCB0aGVuIHRoZSB2YWx1ZSBpcyBzaW1wbHlcbiAqIGFzc2lnbmVkIHRvIHRoZSBwcm9wZXJ0eSB1bmRlciBjb250cm9sLiBJZiB0aGVyZSBhcmUgc3RyaW5nIGxpdGVyYWxzIG9yXG4gKiBtdWx0aXBsZSBleHByZXNzaW9ucywgdGhlbiB0aGUgc3RyaW5ncyBhcmUgZXhwcmVzc2lvbnMgYXJlIGludGVycG9sYXRlZCBpbnRvXG4gKiBhIHN0cmluZyBmaXJzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5Q29tbWl0dGVyIGV4dGVuZHMgQXR0cmlidXRlQ29tbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBuYW1lLCBzdHJpbmdzKSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MpO1xuICAgICAgICB0aGlzLnNpbmdsZSA9XG4gICAgICAgICAgICAoc3RyaW5ncy5sZW5ndGggPT09IDIgJiYgc3RyaW5nc1swXSA9PT0gJycgJiYgc3RyaW5nc1sxXSA9PT0gJycpO1xuICAgIH1cbiAgICBfY3JlYXRlUGFydCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wZXJ0eVBhcnQodGhpcyk7XG4gICAgfVxuICAgIF9nZXRWYWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2luZ2xlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJ0c1swXS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIuX2dldFZhbHVlKCk7XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlydHkpIHtcbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudFt0aGlzLm5hbWVdID0gdGhpcy5fZ2V0VmFsdWUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eVBhcnQgZXh0ZW5kcyBBdHRyaWJ1dGVQYXJ0IHtcbn1cbi8vIERldGVjdCBldmVudCBsaXN0ZW5lciBvcHRpb25zIHN1cHBvcnQuIElmIHRoZSBgY2FwdHVyZWAgcHJvcGVydHkgaXMgcmVhZFxuLy8gZnJvbSB0aGUgb3B0aW9ucyBvYmplY3QsIHRoZW4gb3B0aW9ucyBhcmUgc3VwcG9ydGVkLiBJZiBub3QsIHRoZW4gdGhlIHRocmlkXG4vLyBhcmd1bWVudCB0byBhZGQvcmVtb3ZlRXZlbnRMaXN0ZW5lciBpcyBpbnRlcnByZXRlZCBhcyB0aGUgYm9vbGVhbiBjYXB0dXJlXG4vLyB2YWx1ZSBzbyB3ZSBzaG91bGQgb25seSBwYXNzIHRoZSBgY2FwdHVyZWAgcHJvcGVydHkuXG5sZXQgZXZlbnRPcHRpb25zU3VwcG9ydGVkID0gZmFsc2U7XG50cnkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGdldCBjYXB0dXJlKCkge1xuICAgICAgICAgICAgZXZlbnRPcHRpb25zU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0ZXN0Jywgb3B0aW9ucywgb3B0aW9ucyk7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0ZXN0Jywgb3B0aW9ucywgb3B0aW9ucyk7XG59XG5jYXRjaCAoX2UpIHtcbn1cbmV4cG9ydCBjbGFzcyBFdmVudFBhcnQge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGV2ZW50TmFtZSwgZXZlbnRDb250ZXh0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5ldmVudE5hbWUgPSBldmVudE5hbWU7XG4gICAgICAgIHRoaXMuZXZlbnRDb250ZXh0ID0gZXZlbnRDb250ZXh0O1xuICAgICAgICB0aGlzLl9ib3VuZEhhbmRsZUV2ZW50ID0gKGUpID0+IHRoaXMuaGFuZGxlRXZlbnQoZSk7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBjb21taXQoKSB7XG4gICAgICAgIHdoaWxlIChpc0RpcmVjdGl2ZSh0aGlzLl9wZW5kaW5nVmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLl9wZW5kaW5nVmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSBub0NoYW5nZTtcbiAgICAgICAgICAgIGRpcmVjdGl2ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcGVuZGluZ1ZhbHVlID09PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld0xpc3RlbmVyID0gdGhpcy5fcGVuZGluZ1ZhbHVlO1xuICAgICAgICBjb25zdCBvbGRMaXN0ZW5lciA9IHRoaXMudmFsdWU7XG4gICAgICAgIGNvbnN0IHNob3VsZFJlbW92ZUxpc3RlbmVyID0gbmV3TGlzdGVuZXIgPT0gbnVsbCB8fFxuICAgICAgICAgICAgb2xkTGlzdGVuZXIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgIChuZXdMaXN0ZW5lci5jYXB0dXJlICE9PSBvbGRMaXN0ZW5lci5jYXB0dXJlIHx8XG4gICAgICAgICAgICAgICAgICAgIG5ld0xpc3RlbmVyLm9uY2UgIT09IG9sZExpc3RlbmVyLm9uY2UgfHxcbiAgICAgICAgICAgICAgICAgICAgbmV3TGlzdGVuZXIucGFzc2l2ZSAhPT0gb2xkTGlzdGVuZXIucGFzc2l2ZSk7XG4gICAgICAgIGNvbnN0IHNob3VsZEFkZExpc3RlbmVyID0gbmV3TGlzdGVuZXIgIT0gbnVsbCAmJiAob2xkTGlzdGVuZXIgPT0gbnVsbCB8fCBzaG91bGRSZW1vdmVMaXN0ZW5lcik7XG4gICAgICAgIGlmIChzaG91bGRSZW1vdmVMaXN0ZW5lcikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMuX2JvdW5kSGFuZGxlRXZlbnQsIHRoaXMuX29wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaG91bGRBZGRMaXN0ZW5lcikge1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucyA9IGdldE9wdGlvbnMobmV3TGlzdGVuZXIpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMuX2JvdW5kSGFuZGxlRXZlbnQsIHRoaXMuX29wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWUgPSBuZXdMaXN0ZW5lcjtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1ZhbHVlID0gbm9DaGFuZ2U7XG4gICAgfVxuICAgIGhhbmRsZUV2ZW50KGV2ZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZS5jYWxsKHRoaXMuZXZlbnRDb250ZXh0IHx8IHRoaXMuZWxlbWVudCwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52YWx1ZS5oYW5kbGVFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyBXZSBjb3B5IG9wdGlvbnMgYmVjYXVzZSBvZiB0aGUgaW5jb25zaXN0ZW50IGJlaGF2aW9yIG9mIGJyb3dzZXJzIHdoZW4gcmVhZGluZ1xuLy8gdGhlIHRoaXJkIGFyZ3VtZW50IG9mIGFkZC9yZW1vdmVFdmVudExpc3RlbmVyLiBJRTExIGRvZXNuJ3Qgc3VwcG9ydCBvcHRpb25zXG4vLyBhdCBhbGwuIENocm9tZSA0MSBvbmx5IHJlYWRzIGBjYXB0dXJlYCBpZiB0aGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0LlxuY29uc3QgZ2V0T3B0aW9ucyA9IChvKSA9PiBvICYmXG4gICAgKGV2ZW50T3B0aW9uc1N1cHBvcnRlZCA/XG4gICAgICAgIHsgY2FwdHVyZTogby5jYXB0dXJlLCBwYXNzaXZlOiBvLnBhc3NpdmUsIG9uY2U6IG8ub25jZSB9IDpcbiAgICAgICAgby5jYXB0dXJlKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcnRzLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNyBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbmltcG9ydCB7IEF0dHJpYnV0ZUNvbW1pdHRlciwgQm9vbGVhbkF0dHJpYnV0ZVBhcnQsIEV2ZW50UGFydCwgTm9kZVBhcnQsIFByb3BlcnR5Q29tbWl0dGVyIH0gZnJvbSAnLi9wYXJ0cy5qcyc7XG4vKipcbiAqIENyZWF0ZXMgUGFydHMgd2hlbiBhIHRlbXBsYXRlIGlzIGluc3RhbnRpYXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHBhcnRzIGZvciBhbiBhdHRyaWJ1dGUtcG9zaXRpb24gYmluZGluZywgZ2l2ZW4gdGhlIGV2ZW50LCBhdHRyaWJ1dGVcbiAgICAgKiBuYW1lLCBhbmQgc3RyaW5nIGxpdGVyYWxzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgYmluZGluZ1xuICAgICAqIEBwYXJhbSBuYW1lICBUaGUgYXR0cmlidXRlIG5hbWVcbiAgICAgKiBAcGFyYW0gc3RyaW5ncyBUaGUgc3RyaW5nIGxpdGVyYWxzLiBUaGVyZSBhcmUgYWx3YXlzIGF0IGxlYXN0IHR3byBzdHJpbmdzLFxuICAgICAqICAgZXZlbnQgZm9yIGZ1bGx5LWNvbnRyb2xsZWQgYmluZGluZ3Mgd2l0aCBhIHNpbmdsZSBleHByZXNzaW9uLlxuICAgICAqL1xuICAgIGhhbmRsZUF0dHJpYnV0ZUV4cHJlc3Npb25zKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcHJlZml4ID0gbmFtZVswXTtcbiAgICAgICAgaWYgKHByZWZpeCA9PT0gJy4nKSB7XG4gICAgICAgICAgICBjb25zdCBjb21pdHRlciA9IG5ldyBQcm9wZXJ0eUNvbW1pdHRlcihlbGVtZW50LCBuYW1lLnNsaWNlKDEpLCBzdHJpbmdzKTtcbiAgICAgICAgICAgIHJldHVybiBjb21pdHRlci5wYXJ0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJlZml4ID09PSAnQCcpIHtcbiAgICAgICAgICAgIHJldHVybiBbbmV3IEV2ZW50UGFydChlbGVtZW50LCBuYW1lLnNsaWNlKDEpLCBvcHRpb25zLmV2ZW50Q29udGV4dCldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmVmaXggPT09ICc/Jykge1xuICAgICAgICAgICAgcmV0dXJuIFtuZXcgQm9vbGVhbkF0dHJpYnV0ZVBhcnQoZWxlbWVudCwgbmFtZS5zbGljZSgxKSwgc3RyaW5ncyldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbWl0dGVyID0gbmV3IEF0dHJpYnV0ZUNvbW1pdHRlcihlbGVtZW50LCBuYW1lLCBzdHJpbmdzKTtcbiAgICAgICAgcmV0dXJuIGNvbWl0dGVyLnBhcnRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgcGFydHMgZm9yIGEgdGV4dC1wb3NpdGlvbiBiaW5kaW5nLlxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZUZhY3RvcnlcbiAgICAgKi9cbiAgICBoYW5kbGVUZXh0RXhwcmVzc2lvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgTm9kZVBhcnQob3B0aW9ucyk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGRlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciA9IG5ldyBEZWZhdWx0VGVtcGxhdGVQcm9jZXNzb3IoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlZmF1bHQtdGVtcGxhdGUtcHJvY2Vzc29yLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNyBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbmltcG9ydCB7IG1hcmtlciwgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlLmpzJztcbi8qKlxuICogVGhlIGRlZmF1bHQgVGVtcGxhdGVGYWN0b3J5IHdoaWNoIGNhY2hlcyBUZW1wbGF0ZXMga2V5ZWQgb25cbiAqIHJlc3VsdC50eXBlIGFuZCByZXN1bHQuc3RyaW5ncy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlRmFjdG9yeShyZXN1bHQpIHtcbiAgICBsZXQgdGVtcGxhdGVDYWNoZSA9IHRlbXBsYXRlQ2FjaGVzLmdldChyZXN1bHQudHlwZSk7XG4gICAgaWYgKHRlbXBsYXRlQ2FjaGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0ZW1wbGF0ZUNhY2hlID0ge1xuICAgICAgICAgICAgc3RyaW5nc0FycmF5OiBuZXcgV2Vha01hcCgpLFxuICAgICAgICAgICAga2V5U3RyaW5nOiBuZXcgTWFwKClcbiAgICAgICAgfTtcbiAgICAgICAgdGVtcGxhdGVDYWNoZXMuc2V0KHJlc3VsdC50eXBlLCB0ZW1wbGF0ZUNhY2hlKTtcbiAgICB9XG4gICAgbGV0IHRlbXBsYXRlID0gdGVtcGxhdGVDYWNoZS5zdHJpbmdzQXJyYXkuZ2V0KHJlc3VsdC5zdHJpbmdzKTtcbiAgICBpZiAodGVtcGxhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuICAgIC8vIElmIHRoZSBUZW1wbGF0ZVN0cmluZ3NBcnJheSBpcyBuZXcsIGdlbmVyYXRlIGEga2V5IGZyb20gdGhlIHN0cmluZ3NcbiAgICAvLyBUaGlzIGtleSBpcyBzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIHdpdGggaWRlbnRpY2FsIGNvbnRlbnRcbiAgICBjb25zdCBrZXkgPSByZXN1bHQuc3RyaW5ncy5qb2luKG1hcmtlcik7XG4gICAgLy8gQ2hlY2sgaWYgd2UgYWxyZWFkeSBoYXZlIGEgVGVtcGxhdGUgZm9yIHRoaXMga2V5XG4gICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZUNhY2hlLmtleVN0cmluZy5nZXQoa2V5KTtcbiAgICBpZiAodGVtcGxhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIG5vdCBzZWVuIHRoaXMga2V5IGJlZm9yZSwgY3JlYXRlIGEgbmV3IFRlbXBsYXRlXG4gICAgICAgIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKHJlc3VsdCwgcmVzdWx0LmdldFRlbXBsYXRlRWxlbWVudCgpKTtcbiAgICAgICAgLy8gQ2FjaGUgdGhlIFRlbXBsYXRlIGZvciB0aGlzIGtleVxuICAgICAgICB0ZW1wbGF0ZUNhY2hlLmtleVN0cmluZy5zZXQoa2V5LCB0ZW1wbGF0ZSk7XG4gICAgfVxuICAgIC8vIENhY2hlIGFsbCBmdXR1cmUgcXVlcmllcyBmb3IgdGhpcyBUZW1wbGF0ZVN0cmluZ3NBcnJheVxuICAgIHRlbXBsYXRlQ2FjaGUuc3RyaW5nc0FycmF5LnNldChyZXN1bHQuc3RyaW5ncywgdGVtcGxhdGUpO1xuICAgIHJldHVybiB0ZW1wbGF0ZTtcbn1cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZUNhY2hlcyA9IG5ldyBNYXAoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLWZhY3RvcnkuanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLyoqXG4gKiBAbW9kdWxlIGxpdC1odG1sXG4gKi9cbmltcG9ydCB7IHJlbW92ZU5vZGVzIH0gZnJvbSAnLi9kb20uanMnO1xuaW1wb3J0IHsgTm9kZVBhcnQgfSBmcm9tICcuL3BhcnRzLmpzJztcbmltcG9ydCB7IHRlbXBsYXRlRmFjdG9yeSB9IGZyb20gJy4vdGVtcGxhdGUtZmFjdG9yeS5qcyc7XG5leHBvcnQgY29uc3QgcGFydHMgPSBuZXcgV2Vha01hcCgpO1xuLyoqXG4gKiBSZW5kZXJzIGEgdGVtcGxhdGUgdG8gYSBjb250YWluZXIuXG4gKlxuICogVG8gdXBkYXRlIGEgY29udGFpbmVyIHdpdGggbmV3IHZhbHVlcywgcmVldmFsdWF0ZSB0aGUgdGVtcGxhdGUgbGl0ZXJhbCBhbmRcbiAqIGNhbGwgYHJlbmRlcmAgd2l0aCB0aGUgbmV3IHJlc3VsdC5cbiAqXG4gKiBAcGFyYW0gcmVzdWx0IGEgVGVtcGxhdGVSZXN1bHQgY3JlYXRlZCBieSBldmFsdWF0aW5nIGEgdGVtcGxhdGUgdGFnIGxpa2VcbiAqICAgICBgaHRtbGAgb3IgYHN2Z2AuXG4gKiBAcGFyYW0gY29udGFpbmVyIEEgRE9NIHBhcmVudCB0byByZW5kZXIgdG8uIFRoZSBlbnRpcmUgY29udGVudHMgYXJlIGVpdGhlclxuICogICAgIHJlcGxhY2VkLCBvciBlZmZpY2llbnRseSB1cGRhdGVkIGlmIHRoZSBzYW1lIHJlc3VsdCB0eXBlIHdhcyBwcmV2aW91c1xuICogICAgIHJlbmRlcmVkIHRoZXJlLlxuICogQHBhcmFtIG9wdGlvbnMgUmVuZGVyT3B0aW9ucyBmb3IgdGhlIGVudGlyZSByZW5kZXIgdHJlZSByZW5kZXJlZCB0byB0aGlzXG4gKiAgICAgY29udGFpbmVyLiBSZW5kZXIgb3B0aW9ucyBtdXN0ICpub3QqIGNoYW5nZSBiZXR3ZWVuIHJlbmRlcnMgdG8gdGhlIHNhbWVcbiAqICAgICBjb250YWluZXIsIGFzIHRob3NlIGNoYW5nZXMgd2lsbCBub3QgZWZmZWN0IHByZXZpb3VzbHkgcmVuZGVyZWQgRE9NLlxuICovXG5leHBvcnQgY29uc3QgcmVuZGVyID0gKHJlc3VsdCwgY29udGFpbmVyLCBvcHRpb25zKSA9PiB7XG4gICAgbGV0IHBhcnQgPSBwYXJ0cy5nZXQoY29udGFpbmVyKTtcbiAgICBpZiAocGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlbW92ZU5vZGVzKGNvbnRhaW5lciwgY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICBwYXJ0cy5zZXQoY29udGFpbmVyLCBwYXJ0ID0gbmV3IE5vZGVQYXJ0KE9iamVjdC5hc3NpZ24oeyB0ZW1wbGF0ZUZhY3RvcnkgfSwgb3B0aW9ucykpKTtcbiAgICAgICAgcGFydC5hcHBlbmRJbnRvKGNvbnRhaW5lcik7XG4gICAgfVxuICAgIHBhcnQuc2V0VmFsdWUocmVzdWx0KTtcbiAgICBwYXJ0LmNvbW1pdCgpO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlbmRlci5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vKipcbiAqXG4gKiBNYWluIGxpdC1odG1sIG1vZHVsZS5cbiAqXG4gKiBNYWluIGV4cG9ydHM6XG4gKlxuICogLSAgW1todG1sXV1cbiAqIC0gIFtbc3ZnXV1cbiAqIC0gIFtbcmVuZGVyXV1cbiAqXG4gKiBAbW9kdWxlIGxpdC1odG1sXG4gKiBAcHJlZmVycmVkXG4gKi9cbi8qKlxuICogRG8gbm90IHJlbW92ZSB0aGlzIGNvbW1lbnQ7IGl0IGtlZXBzIHR5cGVkb2MgZnJvbSBtaXNwbGFjaW5nIHRoZSBtb2R1bGVcbiAqIGRvY3MuXG4gKi9cbmltcG9ydCB7IGRlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciB9IGZyb20gJy4vbGliL2RlZmF1bHQtdGVtcGxhdGUtcHJvY2Vzc29yLmpzJztcbmltcG9ydCB7IFNWR1RlbXBsYXRlUmVzdWx0LCBUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJy4vbGliL3RlbXBsYXRlLXJlc3VsdC5qcyc7XG5leHBvcnQgeyBEZWZhdWx0VGVtcGxhdGVQcm9jZXNzb3IsIGRlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciB9IGZyb20gJy4vbGliL2RlZmF1bHQtdGVtcGxhdGUtcHJvY2Vzc29yLmpzJztcbmV4cG9ydCB7IGRpcmVjdGl2ZSwgaXNEaXJlY3RpdmUgfSBmcm9tICcuL2xpYi9kaXJlY3RpdmUuanMnO1xuLy8gVE9ETyhqdXN0aW5mYWduYW5pKTogcmVtb3ZlIGxpbmUgd2hlbiB3ZSBnZXQgTm9kZVBhcnQgbW92aW5nIG1ldGhvZHNcbmV4cG9ydCB7IHJlbW92ZU5vZGVzLCByZXBhcmVudE5vZGVzIH0gZnJvbSAnLi9saWIvZG9tLmpzJztcbmV4cG9ydCB7IG5vQ2hhbmdlLCBub3RoaW5nIH0gZnJvbSAnLi9saWIvcGFydC5qcyc7XG5leHBvcnQgeyBBdHRyaWJ1dGVDb21taXR0ZXIsIEF0dHJpYnV0ZVBhcnQsIEJvb2xlYW5BdHRyaWJ1dGVQYXJ0LCBFdmVudFBhcnQsIGlzUHJpbWl0aXZlLCBOb2RlUGFydCwgUHJvcGVydHlDb21taXR0ZXIsIFByb3BlcnR5UGFydCB9IGZyb20gJy4vbGliL3BhcnRzLmpzJztcbmV4cG9ydCB7IHBhcnRzLCByZW5kZXIgfSBmcm9tICcuL2xpYi9yZW5kZXIuanMnO1xuZXhwb3J0IHsgdGVtcGxhdGVDYWNoZXMsIHRlbXBsYXRlRmFjdG9yeSB9IGZyb20gJy4vbGliL3RlbXBsYXRlLWZhY3RvcnkuanMnO1xuZXhwb3J0IHsgVGVtcGxhdGVJbnN0YW5jZSB9IGZyb20gJy4vbGliL3RlbXBsYXRlLWluc3RhbmNlLmpzJztcbmV4cG9ydCB7IFNWR1RlbXBsYXRlUmVzdWx0LCBUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJy4vbGliL3RlbXBsYXRlLXJlc3VsdC5qcyc7XG5leHBvcnQgeyBjcmVhdGVNYXJrZXIsIGlzVGVtcGxhdGVQYXJ0QWN0aXZlLCBUZW1wbGF0ZSB9IGZyb20gJy4vbGliL3RlbXBsYXRlLmpzJztcbi8vIElNUE9SVEFOVDogZG8gbm90IGNoYW5nZSB0aGUgcHJvcGVydHkgbmFtZSBvciB0aGUgYXNzaWdubWVudCBleHByZXNzaW9uLlxuLy8gVGhpcyBsaW5lIHdpbGwgYmUgdXNlZCBpbiByZWdleGVzIHRvIHNlYXJjaCBmb3IgbGl0LWh0bWwgdXNhZ2UuXG4vLyBUT0RPKGp1c3RpbmZhZ25hbmkpOiBpbmplY3QgdmVyc2lvbiBudW1iZXIgYXQgYnVpbGQgdGltZVxuKHdpbmRvd1snbGl0SHRtbFZlcnNpb25zJ10gfHwgKHdpbmRvd1snbGl0SHRtbFZlcnNpb25zJ10gPSBbXSkpLnB1c2goJzEuMC4wJyk7XG4vKipcbiAqIEludGVycHJldHMgYSB0ZW1wbGF0ZSBsaXRlcmFsIGFzIGFuIEhUTUwgdGVtcGxhdGUgdGhhdCBjYW4gZWZmaWNpZW50bHlcbiAqIHJlbmRlciB0byBhbmQgdXBkYXRlIGEgY29udGFpbmVyLlxuICovXG5leHBvcnQgY29uc3QgaHRtbCA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IG5ldyBUZW1wbGF0ZVJlc3VsdChzdHJpbmdzLCB2YWx1ZXMsICdodG1sJywgZGVmYXVsdFRlbXBsYXRlUHJvY2Vzc29yKTtcbi8qKlxuICogSW50ZXJwcmV0cyBhIHRlbXBsYXRlIGxpdGVyYWwgYXMgYW4gU1ZHIHRlbXBsYXRlIHRoYXQgY2FuIGVmZmljaWVudGx5XG4gKiByZW5kZXIgdG8gYW5kIHVwZGF0ZSBhIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGNvbnN0IHN2ZyA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IG5ldyBTVkdUZW1wbGF0ZVJlc3VsdChzdHJpbmdzLCB2YWx1ZXMsICdzdmcnLCBkZWZhdWx0VGVtcGxhdGVQcm9jZXNzb3IpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGl0LWh0bWwuanMubWFwIiwiY29uc3QgRklSU1QgPSAvXlteXS87XG5jb25zdCBTUEFDRVMgPSAvXFxzKyhbXFxTXSkvZztcbmNvbnN0IENBTUVMUyA9IC9bYS16XShbQS1aXSkvZztcbmNvbnN0IEtFQkFCUyA9IC8tKFthLXpdKS9nO1xuXG5leHBvcnQgZnVuY3Rpb24gY2FwaXRhbGl6ZSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gICAgcmV0dXJuIHN0cmluZyA/IHN0cmluZy5yZXBsYWNlKEZJUlNULCBzdHJpbmdbMF0udG9VcHBlckNhc2UoKSkgOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmNhcGl0YWxpemUgKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcblxuICAgIHJldHVybiBzdHJpbmcgPyBzdHJpbmcucmVwbGFjZShGSVJTVCwgc3RyaW5nWzBdLnRvTG93ZXJDYXNlKCkpIDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FtZWxDYXNlIChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgICBsZXQgbWF0Y2hlcztcblxuICAgIGlmIChzdHJpbmcpIHtcblxuICAgICAgICBzdHJpbmcgPSBzdHJpbmcudHJpbSgpO1xuXG4gICAgICAgIHdoaWxlICgobWF0Y2hlcyA9IFNQQUNFUy5leGVjKHN0cmluZykpKSB7XG5cbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKG1hdGNoZXNbMF0sIG1hdGNoZXNbMV0udG9VcHBlckNhc2UoKSk7XG5cbiAgICAgICAgICAgIFNQQUNFUy5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gS0VCQUJTLmV4ZWMoc3RyaW5nKSkpIHtcblxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UobWF0Y2hlc1swXSwgbWF0Y2hlc1sxXS50b1VwcGVyQ2FzZSgpKTtcblxuICAgICAgICAgICAgS0VCQUJTLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5jYXBpdGFsaXplKHN0cmluZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBrZWJhYkNhc2UgKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcblxuICAgIGxldCBtYXRjaGVzO1xuXG4gICAgaWYgKHN0cmluZykge1xuXG4gICAgICAgIHN0cmluZyA9IHN0cmluZy50cmltKCk7XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gU1BBQ0VTLmV4ZWMoc3RyaW5nKSkpIHtcblxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UobWF0Y2hlc1swXSwgJy0nICsgbWF0Y2hlc1sxXSk7XG5cbiAgICAgICAgICAgIFNQQUNFUy5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gQ0FNRUxTLmV4ZWMoc3RyaW5nKSkpIHtcblxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UobWF0Y2hlc1swXSwgbWF0Y2hlc1swXVswXSArICctJyArIG1hdGNoZXNbMV0pO1xuXG4gICAgICAgICAgICBDQU1FTFMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcgPyBzdHJpbmcudG9Mb3dlckNhc2UoKSA6IHN0cmluZztcbn1cbiIsIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgbWFwIGFuIGF0dHJpYnV0ZSB2YWx1ZSB0byBhIHByb3BlcnR5IHZhbHVlXG4gKi9cbmV4cG9ydCB0eXBlIEF0dHJpYnV0ZU1hcHBlcjxUID0gYW55PiA9ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gVCB8IG51bGw7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgbWFwIGEgcHJvcGVydHkgdmFsdWUgdG8gYW4gYXR0cmlidXRlIHZhbHVlXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5TWFwcGVyPFQgPSBhbnk+ID0gKHZhbHVlOiBUIHwgbnVsbCkgPT4gc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBbiBvYmplY3QgdGhhdCBob2xkcyBhbiB7QGxpbmsgQXR0cmlidXRlTWFwcGVyfSBhbmQgYSB7QGxpbmsgUHJvcGVydHlNYXBwZXJ9XG4gKlxuICogQHJlbWFya3NcbiAqIEZvciB0aGUgbW9zdCBjb21tb24gdHlwZXMsIGEgY29udmVydGVyIGV4aXN0cyB3aGljaCBjYW4gYmUgcmVmZXJlbmNlZCBpbiB0aGUge0BsaW5rIFByb3BlcnR5RGVjbGFyYXRpb259LlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IEN1c3RvbUVsZW1lbnQsIHByb3BlcnR5LCBBdHRyaWJ1dGVDb252ZXJ0ZXJCb29sZWFuIH0gZnJvbSAnY3VzdG9tLWVsZW1lbnQnO1xuICpcbiAqIGV4cG9ydCBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAqXG4gKiAgICAgIEBwcm9wZXJ0eSh7XG4gKiAgICAgICAgICBjb252ZXJ0ZXI6IEF0dHJpYnV0ZUNvbnZlcnRlckJvb2xlYW5cbiAqICAgICAgfSlcbiAqICAgICAgbXlQcm9wZXJ0eSA9IHRydWU7XG4gKiB9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBdHRyaWJ1dGVDb252ZXJ0ZXI8VCA9IGFueT4ge1xuICAgIHRvQXR0cmlidXRlOiBQcm9wZXJ0eU1hcHBlcjxUPjtcbiAgICBmcm9tQXR0cmlidXRlOiBBdHRyaWJ1dGVNYXBwZXI8VD47XG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgYXR0cmlidXRlIGNvbnZlcnRlclxuICpcbiAqIEByZW1hcmtzXG4gKiBUaGlzIGNvbnZlcnRlciBpcyB1c2VkIGFzIHRoZSBkZWZhdWx0IGNvbnZlcnRlciBmb3IgZGVjb3JhdGVkIHByb3BlcnRpZXMgdW5sZXNzIGEgZGlmZmVyZW50IG9uZVxuICogaXMgc3BlY2lmaWVkLiBUaGUgY29udmVydGVyIHRyaWVzIHRvIGluZmVyIHRoZSBwcm9wZXJ0eSB0eXBlIHdoZW4gY29udmVydGluZyB0byBhdHRyaWJ1dGVzIGFuZFxuICogdXNlcyBgSlNPTi5wYXJzZSgpYCB3aGVuIGNvbnZlcnRpbmcgc3RyaW5ncyBmcm9tIGF0dHJpYnV0ZXMuIElmIGBKU09OLnBhcnNlKClgIHRocm93cyBhbiBlcnJvcixcbiAqIHRoZSBjb252ZXJ0ZXIgd2lsbCB1c2UgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBhcyBhIHN0cmluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IEF0dHJpYnV0ZUNvbnZlcnRlckRlZmF1bHQ6IEF0dHJpYnV0ZUNvbnZlcnRlciA9IHtcbiAgICBmcm9tQXR0cmlidXRlOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgICAgLy8gYEpTT04ucGFyc2UoKWAgd2lsbCB0aHJvdyBhbiBlcnJvciBmb3IgZW1wdHkgc3RyaW5ncyAtIHdlIGNvbnNpZGVyIGl0IG51bGxcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBgSlNPTi5wYXJzZSgpYCB3aWxsIHN1Y2Nlc3NmdWxseSBwYXJzZSBgYm9vbGVhbmAsIGBudW1iZXJgIGFuZCBgSlNPTi5zdHJpbmdpZnlgJ2QgdmFsdWVzXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgaXQgdGhyb3dzLCBpdCBtZWFucyB3ZSdyZSBwcm9iYWJseSBkZWFsaW5nIHdpdGggYSByZWd1bGFyIHN0cmluZ1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICB9LFxuICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlID8gJycgOiBudWxsO1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlID09IG51bGwpID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgZGVmYXVsdDogLy8gbnVtYmVyLCBiaWdpbnQsIHN5bWJvbCwgZnVuY3Rpb25cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmV4cG9ydCBjb25zdCBBdHRyaWJ1dGVDb252ZXJ0ZXJCb29sZWFuOiBBdHRyaWJ1dGVDb252ZXJ0ZXI8Ym9vbGVhbj4gPSB7XG4gICAgZnJvbUF0dHJpYnV0ZTogKHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiAodmFsdWUgIT09IG51bGwpLFxuICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IGJvb2xlYW4gfCBudWxsKSA9PiB2YWx1ZSA/ICcnIDogbnVsbFxufVxuXG5leHBvcnQgY29uc3QgQXR0cmlidXRlQ29udmVydGVyU3RyaW5nOiBBdHRyaWJ1dGVDb252ZXJ0ZXI8c3RyaW5nPiA9IHtcbiAgICBmcm9tQXR0cmlidXRlOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+ICh2YWx1ZSA9PT0gbnVsbCkgPyBudWxsIDogdmFsdWUsXG4gICAgLy8gcGFzcyB0aHJvdWdoIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgdG9BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdmFsdWVcbn1cblxuZXhwb3J0IGNvbnN0IEF0dHJpYnV0ZUNvbnZlcnRlck51bWJlcjogQXR0cmlidXRlQ29udmVydGVyPG51bWJlcj4gPSB7XG4gICAgZnJvbUF0dHJpYnV0ZTogKHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiAodmFsdWUgPT09IG51bGwpID8gbnVsbCA6IE51bWJlcih2YWx1ZSksXG4gICAgLy8gcGFzcyB0aHJvdWdoIG51bGwgb3IgdW5kZWZpbmVkIHVzaW5nIGB2YWx1ZSA9PSBudWxsYFxuICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IG51bWJlciB8IG51bGwpID0+ICh2YWx1ZSA9PSBudWxsKSA/IHZhbHVlIDogdmFsdWUudG9TdHJpbmcoKVxufVxuXG5leHBvcnQgY29uc3QgQXR0cmlidXRlQ29udmVydGVyT2JqZWN0OiBBdHRyaWJ1dGVDb252ZXJ0ZXI8b2JqZWN0PiA9IHtcbiAgICAvLyBgSlNPTi5wYXJzZSgpYCB3aWxsIHRocm93IGFuIGVycm9yIGZvciBlbXB0eSBzdHJpbmdzIC0gd2UgY29uc2lkZXIgaXQgbnVsbFxuICAgIGZyb21BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykgPyBudWxsIDogSlNPTi5wYXJzZSh2YWx1ZSksXG4gICAgLy8gcGFzcyB0aHJvdWdoIG51bGwgb3IgdW5kZWZpbmVkIHVzaW5nIGB2YWx1ZSA9PSBudWxsYFxuICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IG9iamVjdCB8IG51bGwpID0+ICh2YWx1ZSA9PSBudWxsKSA/IHZhbHVlIDogSlNPTi5zdHJpbmdpZnkodmFsdWUpXG59XG5cbmV4cG9ydCBjb25zdCBBdHRyaWJ1dGVDb252ZXJ0ZXJBcnJheTogQXR0cmlidXRlQ29udmVydGVyPGFueVtdPiA9IHtcbiAgICAvLyBgSlNPTi5wYXJzZSgpYCB3aWxsIHRocm93IGFuIGVycm9yIGZvciBlbXB0eSBzdHJpbmdzIC0gd2UgY29uc2lkZXIgaXQgbnVsbFxuICAgIGZyb21BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykgPyBudWxsIDogSlNPTi5wYXJzZSh2YWx1ZSksXG4gICAgLy8gcGFzcyB0aHJvdWdoIG51bGwgb3IgdW5kZWZpbmVkIHVzaW5nIGB2YWx1ZSA9PSBudWxsYFxuICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IGFueVtdIHwgbnVsbCkgPT4gKHZhbHVlID09IG51bGwpID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcbn07XG5cbmV4cG9ydCBjb25zdCBBdHRyaWJ1dGVDb252ZXJ0ZXJEYXRlOiBBdHRyaWJ1dGVDb252ZXJ0ZXI8RGF0ZT4gPSB7XG4gICAgLy8gYG5ldyBEYXRlKClgIHdpbGwgcmV0dXJuIGFuIGBJbnZhbGlkIERhdGVgIGZvciBlbXB0eSBzdHJpbmdzIC0gd2UgY29uc2lkZXIgaXQgbnVsbFxuICAgIGZyb21BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykgPyBudWxsIDogbmV3IERhdGUodmFsdWUpLFxuICAgIC8vIHBhc3MgdGhyb3VnaCBudWxsIG9yIHVuZGVmaW5lZCB1c2luZyBgdmFsdWUgPT0gbnVsbGBcbiAgICB0b0F0dHJpYnV0ZTogKHZhbHVlOiBEYXRlIHwgbnVsbCkgPT4gKHZhbHVlID09IG51bGwpID8gdmFsdWUgOiB2YWx1ZS50b1N0cmluZygpXG59XG4iLCJpbXBvcnQgeyBDdXN0b21FbGVtZW50IH0gZnJvbSAnLi4vY3VzdG9tLWVsZW1lbnQnO1xuaW1wb3J0IHsga2ViYWJDYXNlIH0gZnJvbSAnLi4vdXRpbHMvc3RyaW5nLXV0aWxzJztcbmltcG9ydCB7IEF0dHJpYnV0ZUNvbnZlcnRlciwgQXR0cmlidXRlQ29udmVydGVyRGVmYXVsdCB9IGZyb20gJy4vYXR0cmlidXRlLWNvbnZlcnRlcic7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgcmVmbGVjdCBhbiBhdHRyaWJ1dGUgdmFsdWUgdG8gYSBwcm9wZXJ0eVxuICovXG5leHBvcnQgdHlwZSBBdHRyaWJ1dGVSZWZsZWN0b3I8VHlwZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQgPSBDdXN0b21FbGVtZW50PiA9ICh0aGlzOiBUeXBlLCBhdHRyaWJ1dGVOYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsLCBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgd2lsbCByZWZsZWN0IGEgcHJvcGVydHkgdmFsdWUgdG8gYW4gYXR0cmlidXRlXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5UmVmbGVjdG9yPFR5cGUgZXh0ZW5kcyBDdXN0b21FbGVtZW50ID0gQ3VzdG9tRWxlbWVudD4gPSAodGhpczogVHlwZSwgcHJvcGVydHlLZXk6IFByb3BlcnR5S2V5LCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGRpc3BhdGNoIGEgY3VzdG9tIGV2ZW50IGZvciBhIHByb3BlcnR5IGNoYW5nZVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eU5vdGlmaWVyPFR5cGUgZXh0ZW5kcyBDdXN0b21FbGVtZW50ID0gQ3VzdG9tRWxlbWVudD4gPSAodGhpczogVHlwZSwgcHJvcGVydHlLZXk6IFByb3BlcnR5S2V5LCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIHJldHVybiBgdHJ1ZWAgaWYgdGhlIGBvbGRWYWx1ZWAgYW5kIHRoZSBgbmV3VmFsdWVgIG9mIGEgcHJvcGVydHkgYXJlIGRpZmZlcmVudCwgYGZhbHNlYCBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlDaGFuZ2VEZXRlY3RvciA9IChvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSA9PiBib29sZWFuO1xuXG4vKipcbiAqIEEgdHlwZSBndWFyZCBmb3Ige0BsaW5rIEF0dHJpYnV0ZVJlZmxlY3Rvcn1cbiAqXG4gKiBAcGFyYW0gcmVmbGVjdG9yIEEgcmVmbGVjdG9yIHRvIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQXR0cmlidXRlUmVmbGVjdG9yIChyZWZsZWN0b3I6IGFueSk6IHJlZmxlY3RvciBpcyBBdHRyaWJ1dGVSZWZsZWN0b3Ige1xuXG4gICAgcmV0dXJuIHR5cGVvZiByZWZsZWN0b3IgPT09ICdmdW5jdGlvbic7XG59XG5cbi8qKlxuICogQSB0eXBlIGd1YXJkIGZvciB7QGxpbmsgUHJvcGVydHlSZWZsZWN0b3J9XG4gKlxuICogQHBhcmFtIHJlZmxlY3RvciBBIHJlZmxlY3RvciB0byB0ZXN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1Byb3BlcnR5UmVmbGVjdG9yIChyZWZsZWN0b3I6IGFueSk6IHJlZmxlY3RvciBpcyBQcm9wZXJ0eVJlZmxlY3RvciB7XG5cbiAgICByZXR1cm4gdHlwZW9mIHJlZmxlY3RvciA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBBIHR5cGUgZ3VhcmQgZm9yIHtAbGluayBQcm9wZXJ0eU5vdGlmaWVyfVxuICpcbiAqIEBwYXJhbSBub3RpZmllciBBIG5vdGlmaWVyIHRvIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlOb3RpZmllciAobm90aWZpZXI6IGFueSk6IG5vdGlmaWVyIGlzIFByb3BlcnR5Tm90aWZpZXIge1xuXG4gICAgcmV0dXJuIHR5cGVvZiBub3RpZmllciA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBBIHR5cGUgZ3VhcmQgZm9yIHtAbGluayBQcm9wZXJ0eUNoYW5nZURldGVjdG9yfVxuICpcbiAqIEBwYXJhbSBkZXRlY3RvciBBIGRldGVjdG9yIHRvIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlDaGFuZ2VEZXRlY3RvciAoZGV0ZWN0b3I6IGFueSk6IGRldGVjdG9yIGlzIFByb3BlcnR5Q2hhbmdlRGV0ZWN0b3Ige1xuXG4gICAgcmV0dXJuIHR5cGVvZiBkZXRlY3RvciA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBBIHR5cGUgZ3VhcmQgZm9yIHtAbGluayBQcm9wZXJ0eUtleX1cbiAqXG4gKiBAcGFyYW0ga2V5IEEgcHJvcGVydHkga2V5IHRvIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlLZXkgKGtleTogYW55KToga2V5IGlzIFByb3BlcnR5S2V5IHtcblxuICAgIHJldHVybiB0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyB8fCB0eXBlb2Yga2V5ID09PSAnbnVtYmVyJyB8fCB0eXBlb2Yga2V5ID09PSAnc3ltYm9sJztcbn1cblxuLyoqXG4gKiBFbmNvZGVzIGEgc3RyaW5nIGZvciB1c2UgYXMgaHRtbCBhdHRyaWJ1dGUgcmVtb3ZpbmcgaW52YWxpZCBhdHRyaWJ1dGUgY2hhcmFjdGVyc1xuICpcbiAqIEBwYXJhbSB2YWx1ZSBBIHN0cmluZyB0byBlbmNvZGUgZm9yIHVzZSBhcyBodG1sIGF0dHJpYnV0ZVxuICogQHJldHVybnMgICAgIEFuIGVuY29kZWQgc3RyaW5nIHVzYWJsZSBhcyBodG1sIGF0dHJpYnV0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlQXR0cmlidXRlICh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcblxuICAgIHJldHVybiBrZWJhYkNhc2UodmFsdWUucmVwbGFjZSgvXFxXKy9nLCAnLScpLnJlcGxhY2UoL1xcLSQvLCAnJykpO1xufVxuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhbiBhdHRyaWJ1dGUgbmFtZSBmcm9tIGEgcHJvcGVydHkga2V5XG4gKlxuICogQHJlbWFya3NcbiAqIE51bWVyaWMgcHJvcGVydHkgaW5kZXhlcyBvciBzeW1ib2xzIGNhbiBjb250YWluIGludmFsaWQgY2hhcmFjdGVycyBmb3IgYXR0cmlidXRlIG5hbWVzLiBUaGlzIG1ldGhvZFxuICogc2FuaXRpemVzIHRob3NlIGNoYXJhY3RlcnMgYW5kIHJlcGxhY2VzIHNlcXVlbmNlcyBvZiBpbnZhbGlkIGNoYXJhY3RlcnMgd2l0aCBhIGRhc2guXG4gKiBBdHRyaWJ1dGUgbmFtZXMgYXJlIG5vdCBhbGxvd2VkIHRvIHN0YXJ0IHdpdGggbnVtYmVycyBlaXRoZXIgYW5kIGFyZSBwcmVmaXhlZCB3aXRoICdhdHRyLScuXG4gKlxuICogTi5CLjogV2hlbiB1c2luZyBjdXN0b20gc3ltYm9scyBhcyBwcm9wZXJ0eSBrZXlzLCB1c2UgdW5pcXVlIGRlc2NyaXB0aW9ucyBmb3IgdGhlIHN5bWJvbHMgdG8gYXZvaWRcbiAqIGNsYXNoaW5nIGF0dHJpYnV0ZSBuYW1lcy5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBhID0gU3ltYm9sKCk7XG4gKiBjb25zdCBiID0gU3ltYm9sKCk7XG4gKlxuICogYSAhPT0gYjsgLy8gdHJ1ZVxuICpcbiAqIGNyZWF0ZUF0dHJpYnV0ZU5hbWUoYSkgIT09IGNyZWF0ZUF0dHJpYnV0ZU5hbWUoYik7IC8vIGZhbHNlIC0tPiAnYXR0ci1zeW1ib2wnID09PSAnYXR0ci1zeW1ib2wnXG4gKlxuICogY29uc3QgYyA9IFN5bWJvbCgnYycpO1xuICogY29uc3QgZCA9IFN5bWJvbCgnZCcpO1xuICpcbiAqIGMgIT09IGQ7IC8vIHRydWVcbiAqXG4gKiBjcmVhdGVBdHRyaWJ1dGVOYW1lKGMpICE9PSBjcmVhdGVBdHRyaWJ1dGVOYW1lKGQpOyAvLyB0cnVlIC0tPiAnYXR0ci1zeW1ib2wtYycgPT09ICdhdHRyLXN5bWJvbC1kJ1xuICogYGBgXG4gKlxuICogQHBhcmFtIHByb3BlcnR5S2V5ICAgQSBwcm9wZXJ0eSBrZXkgdG8gY29udmVydCB0byBhbiBhdHRyaWJ1dGUgbmFtZVxuICogQHJldHVybnMgICAgICAgICAgICAgVGhlIGdlbmVyYXRlZCBhdHRyaWJ1dGUgbmFtZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXR0cmlidXRlTmFtZSAocHJvcGVydHlLZXk6IFByb3BlcnR5S2V5KTogc3RyaW5nIHtcblxuICAgIGlmICh0eXBlb2YgcHJvcGVydHlLZXkgPT09ICdzdHJpbmcnKSB7XG5cbiAgICAgICAgcmV0dXJuIGtlYmFiQ2FzZShwcm9wZXJ0eUtleSk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIC8vIFRPRE86IHRoaXMgY291bGQgY3JlYXRlIG11bHRpcGxlIGlkZW50aWNhbCBhdHRyaWJ1dGUgbmFtZXMsIGlmIHN5bWJvbHMgZG9uJ3QgaGF2ZSB1bmlxdWUgZGVzY3JpcHRpb25cbiAgICAgICAgcmV0dXJuIGBhdHRyLSR7IGVuY29kZUF0dHJpYnV0ZShTdHJpbmcocHJvcGVydHlLZXkpKSB9YDtcbiAgICB9XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGV2ZW50IG5hbWUgZnJvbSBhIHByb3BlcnR5IGtleVxuICpcbiAqIEByZW1hcmtzXG4gKiBFdmVudCBuYW1lcyBkb24ndCBoYXZlIHRoZSBzYW1lIHJlc3RyaWN0aW9ucyBhcyBhdHRyaWJ1dGUgbmFtZXMgd2hlbiBpdCBjb21lcyB0byBpbnZhbGlkXG4gKiBjaGFyYWN0ZXJzLiBIb3dldmVyLCBmb3IgY29uc2lzdGVuY2llcyBzYWtlLCB3ZSBhcHBseSB0aGUgc2FtZSBydWxlcyBmb3IgZXZlbnQgbmFtZXMgYXNcbiAqIGZvciBhdHRyaWJ1dGUgbmFtZXMuXG4gKlxuICogQHBhcmFtIHByb3BlcnR5S2V5ICAgQSBwcm9wZXJ0eSBrZXkgdG8gY29udmVydCB0byBhbiBhdHRyaWJ1dGUgbmFtZVxuICogQHBhcmFtIHByZWZpeCAgICAgICAgQW4gb3B0aW9uYWwgcHJlZml4LCBlLmcuOiAnb24nXG4gKiBAcGFyYW0gc3VmZml4ICAgICAgICBBbiBvcHRpb25hbCBzdWZmaXgsIGUuZy46ICdjaGFuZ2VkJ1xuICogQHJldHVybnMgICAgICAgICAgICAgVGhlIGdlbmVyYXRlZCBldmVudCBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFdmVudE5hbWUgKHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSwgcHJlZml4Pzogc3RyaW5nLCBzdWZmaXg/OiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gICAgbGV0IHByb3BlcnR5U3RyaW5nID0gJyc7XG5cbiAgICBpZiAodHlwZW9mIHByb3BlcnR5S2V5ID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgIHByb3BlcnR5U3RyaW5nID0ga2ViYWJDYXNlKHByb3BlcnR5S2V5KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gVE9ETzogdGhpcyBjb3VsZCBjcmVhdGUgbXVsdGlwbGUgaWRlbnRpY2FsIGV2ZW50IG5hbWVzLCBpZiBzeW1ib2xzIGRvbid0IGhhdmUgdW5pcXVlIGRlc2NyaXB0aW9uXG4gICAgICAgIHByb3BlcnR5U3RyaW5nID0gZW5jb2RlQXR0cmlidXRlKFN0cmluZyhwcm9wZXJ0eUtleSkpO1xuICAgIH1cblxuICAgIHJldHVybiBgJHsgcHJlZml4ID8gYCR7IGtlYmFiQ2FzZShwcmVmaXgpIH0tYCA6ICcnIH0keyBwcm9wZXJ0eVN0cmluZyB9JHsgc3VmZml4ID8gYC0keyBrZWJhYkNhc2Uoc3VmZml4KSB9YCA6ICcnIH1gO1xufVxuXG4vKipcbiAqIEEge0BsaW5rIEN1c3RvbUVsZW1lbnR9IHByb3BlcnR5IGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydHlEZWNsYXJhdGlvbjxUeXBlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCA9IEN1c3RvbUVsZW1lbnQ+IHtcbiAgICAvKipcbiAgICAgKiBEb2VzIHByb3BlcnR5IGhhdmUgYW4gYXNzb2NpYXRlZCBhdHRyaWJ1dGU/XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBvc3NpYmxlIHZhbHVlczpcbiAgICAgKiAqIGBmYWxzZWA6IE5vIGF0dHJpYnV0ZSB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHByb3BlcnR5XG4gICAgICogKiBgdHJ1ZWA6IFRoZSBhdHRyaWJ1dGUgbmFtZSB3aWxsIGJlIGluZmVycmVkIGJ5IGNhbWVsLWNhc2luZyB0aGUgcHJvcGVydHkgbmFtZVxuICAgICAqICogYHN0cmluZ2A6IFVzZSB0aGUgcHJvdmlkZWQgc3RyaW5nIGFzIHRoZSBhc3NvY2lhdGVkIGF0dHJpYnV0ZSBuYW1lXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgdHJ1ZWBcbiAgICAgKi9cbiAgICBhdHRyaWJ1dGU6IGJvb2xlYW4gfCBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b21pemUgdGhlIGNvbnZlcnNpb24gb2YgdmFsdWVzIGJldHdlZW4gcHJvcGVydHkgYW5kIGFzc29jaWF0ZWQgYXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIENvbnZlcnRlcnMgYXJlIG9ubHkgdXNlZCB3aGVuIHtAbGluayByZWZsZWN0UHJvcGVydHl9IGFuZC9vciB7QGxpbmsgcmVmbGVjdEF0dHJpYnV0ZX0gYXJlIHNldCB0byB0cnVlLlxuICAgICAqIElmIGN1c3RvbSByZWZsZWN0b3JzIGFyZSB1c2VkLCB0aGV5IGhhdmUgdG8gdGFrZSBjYXJlIG9yIGNvbnZlcnRpbmcgdGhlIHByb3BlcnR5L2F0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgQVRUUklCVVRFX0NPTlZFUlRFUlMuZGVmYXVsdGBcbiAgICAgKi9cbiAgICBjb252ZXJ0ZXI6IEF0dHJpYnV0ZUNvbnZlcnRlcjtcblxuICAgIC8qKlxuICAgICAqIFNob3VsZCB0aGUgYXNzb2NpYXRlZCBhdHRyaWJ1dGUncyB2YWx1ZSBiZSBhdXRvbWF0aWNhbGx5IHJlZmxlY3RlZCB0byB0aGUgcHJvcGVydHk/XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBvc3NpYmxlIHZhbHVlczpcbiAgICAgKiAqIGBmYWxzZWA6IFRoZSBhdHRyaWJ1dGUgdmFsdWUgd2lsbCBub3QgYmUgcmVmbGVjdGVkIHRvIHRoZSBwcm9wZXJ0eSBhdXRvbWF0aWNhbGx5XG4gICAgICogKiBgdHJ1ZWA6IEFueSBhdHRyaWJ1dGUgY2hhbmdlIHdpbGwgYmUgcmVmbGVjdGVkIGF1dG9tYXRpY2FsbHkgdG8gdGhlIHByb3BlcnR5IHVzaW5nIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZSByZWZsZWN0b3JcbiAgICAgKiAqIGBQcm9wZXJ0eUtleWA6IEEgbWV0aG9kIG9uIHRoZSBjdXN0b20gZWxlbWVudCB3aXRoIHRoYXQgcHJvcGVydHkga2V5IHdpbGwgYmUgaW52b2tlZCB0byBoYW5kbGUgdGhlIGF0dHJpYnV0ZSByZWZsZWN0aW9uXG4gICAgICogKiBgRnVuY3Rpb25gOiBUaGUgcHJvdmlkZWQgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIHdpdGggaXRzIGB0aGlzYCBjb250ZXh0IGJvdW5kIHRvIHRoZSBjdXN0b20gZWxlbWVudCBpbnN0YW5jZVxuICAgICAqXG4gICAgICogRGVmYXVsdCB2YWx1ZTogYHRydWVgXG4gICAgICovXG4gICAgcmVmbGVjdEF0dHJpYnV0ZTogYm9vbGVhbiB8IGtleW9mIFR5cGUgfCBBdHRyaWJ1dGVSZWZsZWN0b3I8VHlwZT47XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhlIHByb3BlcnR5IHZhbHVlIGJlIGF1dG9tYXRpY2FsbHkgcmVmbGVjdGVkIHRvIHRoZSBhc3NvY2lhdGVkIGF0dHJpYnV0ZT9cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUG9zc2libGUgdmFsdWVzOlxuICAgICAqICogYGZhbHNlYDogVGhlIHByb3BlcnR5IHZhbHVlIHdpbGwgbm90IGJlIHJlZmxlY3RlZCB0byB0aGUgYXNzb2NpYXRlZCBhdHRyaWJ1dGUgYXV0b21hdGljYWxseVxuICAgICAqICogYHRydWVgOiBBbnkgcHJvcGVydHkgY2hhbmdlIHdpbGwgYmUgcmVmbGVjdGVkIGF1dG9tYXRpY2FsbHkgdG8gdGhlIGFzc29jaWF0ZWQgYXR0cmlidXRlIHVzaW5nIHRoZSBkZWZhdWx0IHByb3BlcnR5IHJlZmxlY3RvclxuICAgICAqICogYFByb3BlcnR5S2V5YDogQSBtZXRob2Qgb24gdGhlIGN1c3RvbSBlbGVtZW50IHdpdGggdGhhdCBwcm9wZXJ0eSBrZXkgd2lsbCBiZSBpbnZva2VkIHRvIGhhbmRsZSB0aGUgcHJvcGVydHkgcmVmbGVjdGlvblxuICAgICAqICogYEZ1bmN0aW9uYDogVGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdpbGwgYmUgaW52b2tlZCB3aXRoIGl0cyBgdGhpc2AgY29udGV4dCBib3VuZCB0byB0aGUgY3VzdG9tIGVsZW1lbnQgaW5zdGFuY2VcbiAgICAgKlxuICAgICAqIERlZmF1bHQgdmFsdWU6IGB0cnVlYFxuICAgICAqL1xuICAgIHJlZmxlY3RQcm9wZXJ0eTogYm9vbGVhbiB8IGtleW9mIFR5cGUgfCBQcm9wZXJ0eVJlZmxlY3RvcjxUeXBlPjtcblxuICAgIC8qKlxuICAgICAqIFNob3VsZCBhIHByb3BlcnR5IHZhbHVlIGNoYW5nZSByYWlzZSBhIGN1c3RvbSBldmVudD9cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUG9zc2libGUgdmFsdWVzOlxuICAgICAqICogYGZhbHNlYDogRG9uJ3QgY3JlYXRlIGEgY3VzdG9tIGV2ZW50IGZvciB0aGlzIHByb3BlcnR5XG4gICAgICogKiBgdHJ1ZWA6IENyZWF0ZSBjdXN0b20gZXZlbnRzIGZvciB0aGlzIHByb3BlcnR5IGF1dG9tYXRpY2FsbHlcbiAgICAgKiAqIGBQcm9wZXJ0eUtleWA6IFVzZSB0aGUgbWV0aG9kIHdpdGggdGhpcyBwcm9wZXJ0eSBrZXkgb24gdGhlIGN1c3RvbSBlbGVtZW50IHRvIGNyZWF0ZSBjdXN0b20gZXZlbnRzXG4gICAgICogKiBgRnVuY3Rpb25gOiBVc2UgdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbiB0byBjcmVhdGUgY3VzdG9tIGV2ZW50cyAoYHRoaXNgIGNvbnRleHQgd2lsbCBiZSB0aGUgY3VzdG9tIGVsZW1lbnQgaW5zdGFuY2UpXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgdHJ1ZWBcbiAgICAgKi9cbiAgICBub3RpZnk6IGJvb2xlYW4gfCBrZXlvZiBUeXBlIHwgUHJvcGVydHlOb3RpZmllcjxUeXBlPjtcblxuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyZSBob3cgY2hhbmdlcyBvZiB0aGlzIHByb3BlcnR5IHNob3VsZCBiZSBtb25pdG9yZWRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQnkgZGVmYXVsdCBhIGRlY29yYXRlZCBwcm9wZXJ0eSB3aWxsIGJlIG9ic2VydmVkIGZvciBjaGFuZ2VzICh0aHJvdWdoIGEgY3VzdG9tIHNldHRlciBmb3IgdGhlIHByb3BlcnR5KS5cbiAgICAgKiBBbnkgYHNldGAtb3BlcmF0aW9uIG9mIHRoaXMgcHJvcGVydHkgd2lsbCB0aGVyZWZvcmUgcmVxdWVzdCBhbiB1cGRhdGUgb2YgdGhlIGN1c3RvbSBlbGVtZW50IGFuZCBpbml0aWF0ZVxuICAgICAqIGEgcmVuZGVyIGFzIHdlbGwgYXMgcmVmbGVjdGlvbiBhbmQgbm90aWZpY2F0aW9uLlxuICAgICAqXG4gICAgICogUG9zc2libGUgdmFsdWVzOlxuICAgICAqICogYGZhbHNlYDogRG9uJ3Qgb2JzZXJ2ZSBjaGFuZ2VzIG9mIHRoaXMgcHJvcGVydHkgKHRoaXMgd2lsbCBieXBhc3MgcmVuZGVyLCByZWZsZWN0aW9uIGFuZCBub3RpZmljYXRpb24pXG4gICAgICogKiBgdHJ1ZWA6IE9ic2VydmUgY2hhbmdlcyBvZiB0aGlzIHByb3BlcnR5IHVzaW5nIHRoZSB7QGxpbmsgREVGQVVMVF9QUk9QRVJUWV9DSEFOR0VfREVURUNUT1J9XG4gICAgICogKiBgRnVuY3Rpb25gOiBVc2UgdGhlIHByb3ZpZGVkIG1ldGhvZCB0byBjaGVjayBpZiBwcm9wZXJ0eSB2YWx1ZSBoYXMgY2hhbmdlZFxuICAgICAqXG4gICAgICogRGVmYXVsdCB2YWx1ZTogYHRydWVgICh1c2VzIHtAbGluayBERUZBVUxUX1BST1BFUlRZX0NIQU5HRV9ERVRFQ1RPUn0gaW50ZXJuYWxseSlcbiAgICAgKi9cbiAgICBvYnNlcnZlOiBib29sZWFuIHwgUHJvcGVydHlDaGFuZ2VEZXRlY3Rvcjtcbn1cblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBwcm9wZXJ0eSBjaGFuZ2UgZGV0ZWN0b3JcbiAqXG4gKiBAcGFyYW0gb2xkVmFsdWUgIFRoZSBvbGQgcHJvcGVydHkgdmFsdWVcbiAqIEBwYXJhbSBuZXdWYWx1ZSAgVGhlIG5ldyBwcm9wZXJ0eSB2YWx1ZVxuICogQHJldHVybnMgICAgICAgICBBIGJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGUgcHJvcGVydHkgdmFsdWUgY2hhbmdlZFxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9QUk9QRVJUWV9DSEFOR0VfREVURUNUT1I6IFByb3BlcnR5Q2hhbmdlRGV0ZWN0b3IgPSAob2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkgPT4ge1xuICAgIC8vIGluIGNhc2UgYG9sZFZhbHVlYCBhbmQgYG5ld1ZhbHVlYCBhcmUgYE5hTmAsIGAoTmFOICE9PSBOYU4pYCByZXR1cm5zIGB0cnVlYCxcbiAgICAvLyBidXQgYChOYU4gPT09IE5hTiB8fCBOYU4gPT09IE5hTilgIHJldHVybnMgYGZhbHNlYFxuICAgIHJldHVybiBvbGRWYWx1ZSAhPT0gbmV3VmFsdWUgJiYgKG9sZFZhbHVlID09PSBvbGRWYWx1ZSB8fCBuZXdWYWx1ZSA9PT0gbmV3VmFsdWUpO1xufTtcblxuLyoqXG4gKiBUaGUgZGVmYXVsdCB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gcHJvcGVydHkgZGVjbGFyYXRpb25cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfUFJPUEVSVFlfREVDTEFSQVRJT046IFByb3BlcnR5RGVjbGFyYXRpb24gPSB7XG4gICAgYXR0cmlidXRlOiB0cnVlLFxuICAgIGNvbnZlcnRlcjogQXR0cmlidXRlQ29udmVydGVyRGVmYXVsdCxcbiAgICByZWZsZWN0QXR0cmlidXRlOiB0cnVlLFxuICAgIHJlZmxlY3RQcm9wZXJ0eTogdHJ1ZSxcbiAgICBub3RpZnk6IHRydWUsXG4gICAgb2JzZXJ2ZTogREVGQVVMVF9QUk9QRVJUWV9DSEFOR0VfREVURUNUT1IsXG59O1xuIiwiaW1wb3J0IHsgcmVuZGVyLCBUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCB7IExpc3RlbmVyRGVjbGFyYXRpb24gfSBmcm9tICcuL2RlY29yYXRvcnMvbGlzdGVuZXInO1xuaW1wb3J0IHsgQXR0cmlidXRlUmVmbGVjdG9yLCBjcmVhdGVFdmVudE5hbWUsIGlzQXR0cmlidXRlUmVmbGVjdG9yLCBpc1Byb3BlcnR5Q2hhbmdlRGV0ZWN0b3IsIGlzUHJvcGVydHlLZXksIGlzUHJvcGVydHlOb3RpZmllciwgaXNQcm9wZXJ0eVJlZmxlY3RvciwgUHJvcGVydHlEZWNsYXJhdGlvbiwgUHJvcGVydHlOb3RpZmllciwgUHJvcGVydHlSZWZsZWN0b3IgfSBmcm9tIFwiLi9kZWNvcmF0b3JzL3Byb3BlcnR5LWRlY2xhcmF0aW9uXCI7XG5cbmNvbnN0IEFUVFJJQlVURV9SRUZMRUNUT1JfRVJST1IgPSAoYXR0cmlidXRlUmVmbGVjdG9yOiBQcm9wZXJ0eUtleSB8IEZ1bmN0aW9uKSA9PiBuZXcgRXJyb3IoYEVycm9yIGV4ZWN1dGluZyBhdHRyaWJ1dGUgcmVmbGVjdG9yICR7IFN0cmluZyhhdHRyaWJ1dGVSZWZsZWN0b3IpIH0uYCk7XG5jb25zdCBQUk9QRVJUWV9SRUZMRUNUT1JfRVJST1IgPSAocHJvcGVydHlSZWZsZWN0b3I6IFByb3BlcnR5S2V5IHwgRnVuY3Rpb24pID0+IG5ldyBFcnJvcihgRXJyb3IgZXhlY3V0aW5nIHByb3BlcnR5IHJlZmxlY3RvciAkeyBTdHJpbmcocHJvcGVydHlSZWZsZWN0b3IpIH0uYCk7XG5jb25zdCBQUk9QRVJUWV9OT1RJRklFUl9FUlJPUiA9IChwcm9wZXJ0eU5vdGlmaWVyOiBQcm9wZXJ0eUtleSB8IEZ1bmN0aW9uKSA9PiBuZXcgRXJyb3IoYEVycm9yIGV4ZWN1dGluZyBwcm9wZXJ0eSBub3RpZmllciAkeyBTdHJpbmcocHJvcGVydHlOb3RpZmllcikgfS5gKTtcbmNvbnN0IENIQU5HRV9ERVRFQ1RPUl9FUlJPUiA9IChjaGFuZ2VEZXRlY3RvcjogUHJvcGVydHlLZXkgfCBGdW5jdGlvbikgPT4gbmV3IEVycm9yKGBFcnJvciBleGVjdXRpbmcgcHJvcGVydHkgY2hhbmdlIGRldGVjdG9yICR7IFN0cmluZyhjaGFuZ2VEZXRlY3RvcikgfS5gKTtcblxuLyoqXG4gKiBFeHRlbmRzIHRoZSBzdGF0aWMge0BsaW5rIExpc3RlbmVyRGVjbGFyYXRpb259IHRvIGluY2x1ZGUgdGhlIGJvdW5kIGxpc3RlbmVyXG4gKiBmb3IgYSBjdXN0b20gZWxlbWVudCBpbnN0YW5jZS5cbiAqL1xuaW50ZXJmYWNlIEluc3RhbmNlTGlzdGVuZXJEZWNsYXJhdGlvbiBleHRlbmRzIExpc3RlbmVyRGVjbGFyYXRpb24ge1xuXG4gICAgLyoqXG4gICAgICogVGhlIGJvdW5kIGxpc3RlbmVyIHdpbGwgYmUgc3RvcmVkIGhlcmUsIHNvIGl0IGNhbiBiZSByZW1vdmVkIGl0IGxhdGVyXG4gICAgICovXG4gICAgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZXZlbnQgdGFyZ2V0IHdpbGwgYWx3YXlzIGJlIHJlc29sdmVkIHRvIGFuIGFjdHVhbCB7QGxpbmsgRXZlbnRUYXJnZXR9XG4gICAgICovXG4gICAgdGFyZ2V0OiBFdmVudFRhcmdldDtcbn1cblxuLyoqXG4gKiBUaGUgY3VzdG9tIGVsZW1lbnQgYmFzZSBjbGFzc1xuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ3VzdG9tRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXN0b20gZWxlbWVudCdzIHNlbGVjdG9yXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFdpbGwgYmUgb3ZlcnJpZGRlbiBieSB0aGUge0BsaW5rIGN1c3RvbUVsZW1lbnR9IGRlY29yYXRvcidzIHNlbGVjdG9yIG9wdGlvbiwgaWYgcHJvdmlkZWQuXG4gICAgICogT3RoZXJ3aXNlIHRoZSBkZWNvcmF0b3Igd2lsbCB1c2UgdGhpcyBwcm9wZXJ0eSB0byBkZWZpbmUgdGhlIGN1c3RvbSBlbGVtZW50LlxuICAgICAqL1xuICAgIHN0YXRpYyBzZWxlY3Rvcjogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVXNlIFNoYWRvdyBET01cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogV2lsbCBiZSBzZXQgYnkgdGhlIHtAbGluayBjdXN0b21FbGVtZW50fSBkZWNvcmF0b3IncyBzaGFkb3cgb3B0aW9uIChkZWZhdWx0cyB0byBgdHJ1ZWApLlxuICAgICAqL1xuICAgIHN0YXRpYyBzaGFkb3c6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBBIG1hcCBvZiBhdHRyaWJ1dGUgbmFtZXMgYW5kIHRoZWlyIHJlc3BlY3RpdmUgcHJvcGVydHkga2V5c1xuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgYXR0cmlidXRlczogTWFwPHN0cmluZywgUHJvcGVydHlLZXk+ID0gbmV3IE1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogQSBtYXAgb2YgcHJvcGVydHkga2V5cyBhbmQgdGhlaXIgcmVzcGVjdGl2ZSBwcm9wZXJ0eSBkZWNsYXJhdGlvbnNcbiAgICAgKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3RhdGljIHByb3BlcnRpZXM6IE1hcDxQcm9wZXJ0eUtleSwgUHJvcGVydHlEZWNsYXJhdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIG1hcCBvZiBwcm9wZXJ0eSBrZXlzIGFuZCB0aGVpciByZXNwZWN0aXZlIGxpc3RlbmVyIGRlY2xhcmF0aW9uc1xuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgbGlzdGVuZXJzOiBNYXA8UHJvcGVydHlLZXksIExpc3RlbmVyRGVjbGFyYXRpb24+ID0gbmV3IE1hcCgpO1xuXG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgdG8gc3BlY2lmeSBhdHRyaWJ1dGVzIHdoaWNoIHNob3VsZCBiZSBvYnNlcnZlZCwgYnV0IGRvbid0IGhhdmUgYW4gYXNzb2NpYXRlZCBwcm9wZXJ0eVxuICAgICAqXG4gICAgICogQHJlbWFya1xuICAgICAqIEZvciBwcm9wZXJ0aWVzIHdoaWNoIGFyZSBkZWNvcmF0ZWQgd2l0aCB0aGUge0BsaW5rIHByb3BlcnR5fSBkZWNvcmF0b3IsIGFuIG9ic2VydmVkIGF0dHJpYnV0ZVxuICAgICAqIGlzIGF1dG9tYXRpY2FsbHkgY3JlYXRlZCBhbmQgZG9lcyBub3QgbmVlZCB0byBiZSBzcGVjaWZpZWQgaGVyZS4gRm90IGF0dHJpYnV0ZXMgdGhhdCBkb24ndFxuICAgICAqIGhhdmUgYW4gYXNzb2NpYXRlZCBwcm9wZXJ0eSwgcmV0dXJuIHRoZSBhdHRyaWJ1dGUgbmFtZXMgaW4gdGhpcyBnZXR0ZXIuIENoYW5nZXMgdG8gdGhlc2VcbiAgICAgKiBhdHRyaWJ1dGVzIGNhbiBiZSBoYW5kbGVkIGluIHRoZSB7QGxpbmsgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrfSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBXaGVuIGV4dGVuZGluZyBjdXN0b20gZWxlbWVudHMsIG1ha2Ugc3VyZSB0byByZXR1cm4gdGhlIHN1cGVyIGNsYXNzJ3Mgb2JzZXJ2ZWRBdHRyaWJ1dGVzXG4gICAgICogaWYgeW91IG92ZXJyaWRlIHRoaXMgZ2V0dGVyIChleGNlcHQgaWYgeW91IGRvbid0IHdhbnQgdG8gaW5oZXJpdCBvYnNlcnZlZCBhdHRyaWJ1dGVzKTpcbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiBAY3VzdG9tRWxlbWVudCh7XG4gICAgICogICAgICBzZWxlY3RvcjogJ215LWVsZW1lbnQnXG4gICAgICogfSlcbiAgICAgKiBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBNeUJhc2VFbGVtZW50IHtcbiAgICAgKlxuICAgICAqICAgICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMgKCk6IHN0cmluZ1tdIHtcbiAgICAgKlxuICAgICAqICAgICAgICAgIHJldHVybiBbLi4uc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLCAnbXktYWRkaXRpb25hbC1hdHRyaWJ1dGUnXTtcbiAgICAgKiAgICAgIH1cbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICovXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMgKCk6IHN0cmluZ1tdIHtcblxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9yZW5kZXJSb290OiBFbGVtZW50IHwgRG9jdW1lbnRGcmFnbWVudDtcblxuICAgIHByb3RlY3RlZCBfdXBkYXRlUmVxdWVzdDogUHJvbWlzZTxib29sZWFuPiA9IFByb21pc2UucmVzb2x2ZSh0cnVlKTtcblxuICAgIHByb3RlY3RlZCBfY2hhbmdlZFByb3BlcnRpZXM6IE1hcDxQcm9wZXJ0eUtleSwgYW55PiA9IG5ldyBNYXAoKTtcblxuICAgIHByb3RlY3RlZCBfcmVmbGVjdGluZ1Byb3BlcnRpZXM6IE1hcDxQcm9wZXJ0eUtleSwgYW55PiA9IG5ldyBNYXAoKTtcblxuICAgIHByb3RlY3RlZCBfbm90aWZ5aW5nUHJvcGVydGllczogTWFwPFByb3BlcnR5S2V5LCBhbnk+ID0gbmV3IE1hcCgpO1xuXG4gICAgcHJvdGVjdGVkIF9saXN0ZW5lckRlY2xhcmF0aW9uczogSW5zdGFuY2VMaXN0ZW5lckRlY2xhcmF0aW9uW10gPSBbXTtcblxuICAgIHByb3RlY3RlZCBfaXNDb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBfaGFzVXBkYXRlZCA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIF9oYXNSZXF1ZXN0ZWRVcGRhdGUgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBfaXNSZWZsZWN0aW5nID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgY3VzdG9tIGVsZW1lbnQncyB7QGxpbmsgY29ubmVjdGVkQ2FsbGJhY2t9IHdhcyBleGVjdXRlZC5cbiAgICAgKi9cbiAgICBnZXQgaXNDb25uZWN0ZWQgKCk6IGJvb2xlYW4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9pc0Nvbm5lY3RlZDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG5cbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9yZW5kZXJSb290ID0gdGhpcy5jcmVhdGVSZW5kZXJSb290KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBlYWNoIHRpbWUgdGhlIGN1c3RvbSBlbGVtZW50IGlzIG1vdmVkIHRvIGEgbmV3IGRvY3VtZW50XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL1dlYl9Db21wb25lbnRzL1VzaW5nX2N1c3RvbV9lbGVtZW50cyNVc2luZ190aGVfbGlmZWN5Y2xlX2NhbGxiYWNrc1xuICAgICAqL1xuICAgIGFkb3B0ZWRDYWxsYmFjayAoKSB7XG5cbiAgICAgICAgdGhpcy5fbm90aWZ5TGlmZWN5Y2xlKCdhZG9wdGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBlYWNoIHRpbWUgdGhlIGN1c3RvbSBlbGVtZW50IGlzIGFwcGVuZGVkIGludG8gYSBkb2N1bWVudC1jb25uZWN0ZWQgZWxlbWVudFxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9XZWJfQ29tcG9uZW50cy9Vc2luZ19jdXN0b21fZWxlbWVudHMjVXNpbmdfdGhlX2xpZmVjeWNsZV9jYWxsYmFja3NcbiAgICAgKi9cbiAgICBjb25uZWN0ZWRDYWxsYmFjayAoKSB7XG5cbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuX2xpc3RlbigpO1xuXG4gICAgICAgIHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeUxpZmVjeWNsZSgnY29ubmVjdGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBlYWNoIHRpbWUgdGhlIGN1c3RvbSBlbGVtZW50IGlzIGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSBkb2N1bWVudCdzIERPTVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9XZWJfQ29tcG9uZW50cy9Vc2luZ19jdXN0b21fZWxlbWVudHMjVXNpbmdfdGhlX2xpZmVjeWNsZV9jYWxsYmFja3NcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjayAoKSB7XG5cbiAgICAgICAgdGhpcy5faXNDb25uZWN0ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl91bmxpc3RlbigpO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeUxpZmVjeWNsZSgnZGlzY29ubmVjdGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBlYWNoIHRpbWUgb25lIG9mIHRoZSBjdXN0b20gZWxlbWVudCdzIGF0dHJpYnV0ZXMgaXMgYWRkZWQsIHJlbW92ZWQsIG9yIGNoYW5nZWRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogV2hpY2ggYXR0cmlidXRlcyB0byBub3RpY2UgY2hhbmdlIGZvciBpcyBzcGVjaWZpZWQgaW4ge0BsaW5rIG9ic2VydmVkQXR0cmlidXRlc30uXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvV2ViX0NvbXBvbmVudHMvVXNpbmdfY3VzdG9tX2VsZW1lbnRzI1VzaW5nX3RoZV9saWZlY3ljbGVfY2FsbGJhY2tzXG4gICAgICpcbiAgICAgKiBGb3IgZGVjb3JhdGVkIHByb3BlcnRpZXMgd2l0aCBhbiBhc3NvY2lhdGVkIGF0dHJpYnV0ZSwgdGhpcyBpcyBoYW5kbGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBjYW4gYmUgb3ZlcnJpZGRlbiB0byBjdXN0b21pemUgdGhlIGhhbmRsaW5nIG9mIGF0dHJpYnV0ZSBjaGFuZ2VzLiBXaGVuIG92ZXJyaWRpbmdcbiAgICAgKiB0aGlzIG1ldGhvZCwgYSBzdXBlci1jYWxsIHNob3VsZCBiZSBpbmNsdWRlZCwgdG8gZW5zdXJlIGF0dHJpYnV0ZSBjaGFuZ2VzIGZvciBkZWNvcmF0ZWQgcHJvcGVydGllc1xuICAgICAqIGFyZSBwcm9jZXNzZWQgY29ycmVjdGx5LlxuICAgICAqXG4gICAgICogYGBgdHlwZXNjcmlwdFxuICAgICAqIEBjdXN0b21FbGVtZW50KHtcbiAgICAgKiAgICAgIHNlbGVjdG9yOiAnbXktZWxlbWVudCdcbiAgICAgKiB9KVxuICAgICAqIGNsYXNzIE15RWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgICAqXG4gICAgICogICAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgKGF0dHJpYnV0ZTogc3RyaW5nLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG4gICAgICpcbiAgICAgKiAgICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0cmlidXRlLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAqXG4gICAgICogICAgICAgICAgLy8gZG8gY3VzdG9tIGhhbmRsaW5nLi4uXG4gICAgICogICAgICB9XG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIGF0dHJpYnV0ZSBUaGUgbmFtZSBvZiB0aGUgY2hhbmdlZCBhdHRyaWJ1dGVcbiAgICAgKiBAcGFyYW0gb2xkVmFsdWUgIFRoZSBvbGQgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgVGhlIG5ldyB2YWx1ZSBvZiB0aGUgYXR0cmlidXRlXG4gICAgICovXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIChhdHRyaWJ1dGU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZyB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG5cbiAgICAgICAgaWYgKHRoaXMuX2lzUmVmbGVjdGluZykgcmV0dXJuO1xuXG4gICAgICAgIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUpIHRoaXMucmVmbGVjdEF0dHJpYnV0ZShhdHRyaWJ1dGUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBlYWNoIHRpbWUgdGhlIGN1c3RvbSBlbGVtZW50IHVwZGF0ZXNcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGFuZ2VkUHJvcGVydGllcyBBIG1hcCBvZiBwcm9wZXJ0aWVzIHRoYXQgY2hhbmdlZCBpbiB0aGUgdXBkYXRlLCBjb250YWluZyB0aGUgcHJvcGVydHkga2V5IGFuZCB0aGUgb2xkIHZhbHVlXG4gICAgICogQHBhcmFtIGZpcnN0VXBkYXRlICAgICAgIEEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoaXMgd2FzIHRoZSBmaXJzdCB1cGRhdGVcbiAgICAgKi9cbiAgICB1cGRhdGVDYWxsYmFjayAoY2hhbmdlZFByb3BlcnRpZXM6IE1hcDxQcm9wZXJ0eUtleSwgYW55PiwgZmlyc3RVcGRhdGU6IGJvb2xlYW4pIHtcblxuICAgICAgICB0aGlzLl9ub3RpZnlMaWZlY3ljbGUoJ3VwZGF0ZScsIHsgZmlyc3RVcGRhdGUgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgY3VzdG9tIGVsZW1lbnQncyByZW5kZXIgcm9vdFxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGUgcmVuZGVyIHJvb3QgaXMgd2hlcmUgdGhlIHtAbGluayByZW5kZXJ9IG1ldGhvZCB3aWxsIGF0dGFjaCBpdHMgRE9NIG91dHB1dC5cbiAgICAgKiBXaGVuIHVzaW5nIHRoZSBjdXN0b20gZWxlbWVudCB3aXRoIHNoYWRvdyBtb2RlLCBpdCB3aWxsIGJlIGEgc2hhZG93IHJvb3QsXG4gICAgICogb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdGhlIGN1c3RvbSBlbGVtZW50IGl0c2VsZi5cbiAgICAgKlxuICAgICAqIFRPRE86IENhbiBzbG90cyBiZSB1c2VkIHdpdGhvdXQgc2hhZG93IERPTT9cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgY3JlYXRlUmVuZGVyUm9vdCAoKTogRWxlbWVudCB8IERvY3VtZW50RnJhZ21lbnQge1xuXG4gICAgICAgIHJldHVybiAodGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgQ3VzdG9tRWxlbWVudCkuc2hhZG93ID9cbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pIDpcbiAgICAgICAgICAgIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdGVtcGxhdGUgb2YgdGhlIGN1c3RvbSBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIE92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgYSB0ZW1wbGF0ZSBmb3IgeW91ciBjdXN0b20gZWxlbWVudC4gVGhlIG1ldGhvZCBtdXN0XG4gICAgICogcmV0dXJuIGEge0BsaW5rIGxpdC1odG1sI1RlbXBsYXRlUmVzdWx0fSB3aGljaCBpcyBjcmVhdGVkIHVzaW5nIGxpdC1odG1sJ3NcbiAgICAgKiB7QGxpbmsgbGl0LWh0bWwjaHRtbCB8IGBodG1sYH0gb3Ige0BsaW5rIGxpdC1odG1sI3N2ZyB8IGBzdmdgfSB0ZW1wbGF0ZSBtZXRob2RzLlxuICAgICAqXG4gICAgICogUmV0dXJuIG5vdGhpbmcgaWYgeW91ciBjb21wb25lbnQgZG9lcyBub3QgbmVlZCB0byByZW5kZXIgYSB0ZW1wbGF0ZS5cbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiBpbXBvcnQgeyBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuICAgICAqXG4gICAgICogQGN1c3RvbUVsZW1lbnQoe1xuICAgICAqICAgICAgc2VsZWN0b3I6ICdteS1lbGVtZW50J1xuICAgICAqIH0pXG4gICAgICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgICpcbiAgICAgKiAgICAgICBteVByb3BlcnR5ID0gJ0hlbGxvJztcbiAgICAgKlxuICAgICAqICAgICAgdGVtcGxhdGUgKCkge1xuICAgICAqXG4gICAgICogICAgICAgICAgaHRtbGA8aDE+JHt0aGlzLm15UHJvcGVydHl9IFdvcmxkITwvaDE+YDtcbiAgICAgKiAgICAgIH1cbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHRlbXBsYXRlICgpOiBUZW1wbGF0ZVJlc3VsdCB8IHZvaWQgeyB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBjdXN0b20gZWxlbWVudCdzIHRlbXBsYXRlIHRvIGl0cyB7QGxpbmsgX3JlbmRlclJvb3R9XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFVzZXMgbGl0LWh0bWwncyB7QGxpbmsgbGl0LWh0bWwjcmVuZGVyfSBtZXRob2QgdG8gcmVuZGVyIGEge0BsaW5rIGxpdC1odG1sI1RlbXBsYXRlUmVzdWx0fS5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgcmVuZGVyICgpIHtcblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGUoKTtcblxuICAgICAgICBpZiAodGVtcGxhdGUpIHJlbmRlcih0ZW1wbGF0ZSwgdGhpcy5fcmVuZGVyUm9vdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2F0Y2ggcHJvcGVydHkgY2hhbmdlcyBvY2N1cnJpbmcgaW4gdGhlIGV4ZWN1dG9yIGFuZCByYWlzZSBjdXN0b20gZXZlbnRzXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFByb3BlcnR5IGNoYW5nZXMgc2hvdWxkIHRyaWdnZXIgY3VzdG9tIGV2ZW50cyB3aGVuIHRoZXkgYXJlIGNhdXNlZCBieSBpbnRlcm5hbCBzdGF0ZSBjaGFuZ2VzLFxuICAgICAqIGJ1dCBub3QgaWYgdGhleSBhcmUgY2F1c2VkIGJ5IGEgY29uc3VtZXIgb2YgdGhlIGN1c3RvbSBlbGVtZW50IEFQSSBkaXJlY3RseSwgZS5nLjpcbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdteS1jdXN0b20tZWxlbWVudCcpLmN1c3RvbVByb3BlcnR5ID0gdHJ1ZTtcbiAgICAgKiBgYGAuXG4gICAgICpcbiAgICAgKiBUaGlzIG1lYW5zLCB3ZSBjYW5ub3QgYXV0b21hdGUgdGhpcyBwcm9jZXNzIHRocm91Z2ggcHJvcGVydHkgc2V0dGVycywgYXMgd2UgY2FuJ3QgYmUgc3VyZSB3aG9cbiAgICAgKiBpbnZva2VkIHRoZSBzZXR0ZXIgLSBpbnRlcm5hbCBjYWxscyBvciBleHRlcm5hbCBjYWxscy5cbiAgICAgKlxuICAgICAqIE9uZSBvcHRpb24gaXMgdG8gbWFudWFsbHkgcmFpc2UgdGhlIGV2ZW50LCB3aGljaCBjYW4gYmVjb21lIHRlZGlvdXMgYW5kIGZvcmNlcyB1cyB0byB1c2Ugc3RyaW5nLVxuICAgICAqIGJhc2VkIGV2ZW50IG5hbWVzIG9yIHByb3BlcnR5IG5hbWVzLCB3aGljaCBhcmUgZGlmZmljdWx0IHRvIHJlZmFjdG9yLCBlLmcuOlxuICAgICAqXG4gICAgICogYGBgdHlwZXNjcmlwdFxuICAgICAqIHRoaXMuY3VzdG9tUHJvcGVydHkgPSB0cnVlO1xuICAgICAqIC8vIGlmIHdlIHJlZmFjdG9yIHRoZSBwcm9wZXJ0eSBuYW1lLCB3ZSBjYW4gZWFzaWx5IG1pc3MgdGhlIG5vdGlmeSBjYWxsXG4gICAgICogdGhpcy5ub3RpZnkoJ2N1c3RvbVByb3BlcnR5Jyk7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBBIG1vcmUgY29udmVuaWVudCB3YXkgaXMgdG8gZXhlY3V0ZSB0aGUgaW50ZXJuYWwgY2hhbmdlcyBpbiBhIHdyYXBwZXIgd2hpY2ggY2FuIGRldGVjdCB0aGUgY2hhbmdlZFxuICAgICAqIHByb3BlcnRpZXMgYW5kIHdpbGwgYXV0b21hdGljYWxseSByYWlzZSB0aGUgcmVxdWlyZWQgZXZlbnRzLiBUaGlzIGVsaW1pbmF0ZXMgdGhlIG5lZWQgdG8gbWFudWFsbHlcbiAgICAgKiByYWlzZSBldmVudHMgYW5kIHJlZmFjdG9yaW5nIGRvZXMgbm8gbG9uZ2VyIGFmZmVjdCB0aGUgcHJvY2Vzcy5cbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiB0aGlzLndhdGNoKCgpID0+IHtcbiAgICAgKlxuICAgICAqICAgICAgdGhpcy5jdXN0b21Qcm9wZXJ0eSA9IHRydWU7XG4gICAgICogICAgICAvLyB3ZSBjYW4gYWRkIG1vcmUgcHJvcGVydHkgbW9kaWZpY2F0aW9ucyB0byBub3RpZnkgaW4gaGVyZVxuICAgICAqIH0pO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIGV4ZWN1dG9yIEEgZnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0aGUgY2hhbmdlcyB3aGljaCBzaG91bGQgYmUgbm90aWZpZWRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgd2F0Y2ggKGV4ZWN1dG9yOiAoKSA9PiB2b2lkKSB7XG5cbiAgICAgICAgLy8gYmFjayB1cCBjdXJyZW50IGNoYW5nZWQgcHJvcGVydGllc1xuICAgICAgICBjb25zdCBwcmV2aW91c0NoYW5nZXMgPSBuZXcgTWFwKHRoaXMuX2NoYW5nZWRQcm9wZXJ0aWVzKTtcblxuICAgICAgICAvLyBleGVjdXRlIHRoZSBjaGFuZ2VzXG4gICAgICAgIGV4ZWN1dG9yKCk7XG5cbiAgICAgICAgLy8gYWRkIGFsbCBuZXcgb3IgdXBkYXRlZCBjaGFuZ2VkIHByb3BlcnRpZXMgdG8gdGhlIG5vdGlmeWluZyBwcm9wZXJ0aWVzXG4gICAgICAgIGZvciAoY29uc3QgW3Byb3BlcnR5S2V5LCBvbGRWYWx1ZV0gb2YgdGhpcy5fY2hhbmdlZFByb3BlcnRpZXMpIHtcblxuICAgICAgICAgICAgaWYgKCFwcmV2aW91c0NoYW5nZXMuaGFzKHByb3BlcnR5S2V5KSB8fCB0aGlzLmhhc0NoYW5nZWQocHJvcGVydHlLZXksIHByZXZpb3VzQ2hhbmdlcy5nZXQocHJvcGVydHlLZXkpLCBvbGRWYWx1ZSkpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX25vdGlmeWluZ1Byb3BlcnRpZXMuc2V0KHByb3BlcnR5S2V5LCBvbGRWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFuIHVwZGF0ZSBvZiB0aGUgY3VzdG9tIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGUgdmFsdWUgb2YgYSBkZWNvcmF0ZWQgcHJvcGVydHkgb3IgaXRzIGFzc29jaWF0ZWRcbiAgICAgKiBhdHRyaWJ1dGUgY2hhbmdlcy4gSWYgeW91IG5lZWQgdGhlIGN1c3RvbSBlbGVtZW50IHRvIHVwZGF0ZSBiYXNlZCBvbiBhIHN0YXRlIGNoYW5nZSB0aGF0IGlzXG4gICAgICogbm90IGNvdmVyZWQgYnkgYSBkZWNvcmF0ZWQgcHJvcGVydHksIGNhbGwgdGhpcyBtZXRob2Qgd2l0aG91dCBhbnkgYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5ICAgVGhlIG5hbWUgb2YgdGhlIGNoYW5nZWQgcHJvcGVydHkgdGhhdCByZXF1ZXN0cyB0aGUgdXBkYXRlXG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIHRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKiBAcmV0dXJucyAgICAgICAgICAgICBBIFByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgdXBkYXRlIGlzIGNvbXBsZXRlZFxuICAgICAqL1xuICAgIHByb3RlY3RlZCByZXF1ZXN0VXBkYXRlIChwcm9wZXJ0eUtleT86IFByb3BlcnR5S2V5LCBvbGRWYWx1ZT86IGFueSwgbmV3VmFsdWU/OiBhbnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcblxuICAgICAgICBpZiAocHJvcGVydHlLZXkpIHtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmhhc0NoYW5nZWQocHJvcGVydHlLZXksIG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHJldHVybiB0aGlzLl91cGRhdGVSZXF1ZXN0O1xuXG4gICAgICAgICAgICAvLyBzdG9yZSBjaGFuZ2VkIHByb3BlcnR5IGZvciBiYXRjaCBwcm9jZXNzaW5nXG4gICAgICAgICAgICB0aGlzLl9jaGFuZ2VkUHJvcGVydGllcy5zZXQocHJvcGVydHlLZXksIG9sZFZhbHVlKTtcblxuICAgICAgICAgICAgLy8gaWYgd2UgYXJlIGluIHJlZmxlY3Rpbmcgc3RhdGUsIGFuIGF0dHJpYnV0ZSBpcyByZWZsZWN0aW5nIHRvIHRoaXMgcHJvcGVydHkgYW5kIHdlXG4gICAgICAgICAgICAvLyBjYW4gc2tpcCByZWZsZWN0aW5nIHRoZSBwcm9wZXJ0eSBiYWNrIHRvIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIC8vIHByb3BlcnR5IGNoYW5nZXMgbmVlZCB0byBiZSB0cmFja2VkIGhvd2V2ZXIgYW5kIHtAbGluayByZW5kZXJ9IG11c3QgYmUgY2FsbGVkIGFmdGVyXG4gICAgICAgICAgICAvLyB0aGUgYXR0cmlidXRlIGNoYW5nZSBpcyByZWZsZWN0ZWQgdG8gdGhpcyBwcm9wZXJ0eVxuICAgICAgICAgICAgLy8gVE9ETzogTWF5YmUgZG9uJ3QgcHV0IGl0IGhlcmUgaWYgbm90IG1hcmtlZCBhcyByZWZsZWN0ZWRcbiAgICAgICAgICAgIGlmICghdGhpcy5faXNSZWZsZWN0aW5nKSB0aGlzLl9yZWZsZWN0aW5nUHJvcGVydGllcy5zZXQocHJvcGVydHlLZXksIG9sZFZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5faGFzUmVxdWVzdGVkVXBkYXRlKSB7XG5cbiAgICAgICAgICAgIC8vIGVucXVldWUgdXBkYXRlIHJlcXVlc3QgaWYgbm9uZSB3YXMgZW5xdWV1ZWQgYWxyZWFkeVxuICAgICAgICAgICAgdGhpcy5fZW5xdWV1ZVVwZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwZGF0ZVJlcXVlc3Q7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgY3VzdG9tIGVsZW1lbnQgYWZ0ZXIgYW4gdXBkYXRlIHdhcyByZXF1ZXN0ZWQgd2l0aCB7QGxpbmsgcmVxdWVzdFVwZGF0ZX1cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBtZXRob2QgcmVuZGVycyB0aGUgdGVtcGxhdGUsIHJlZmxlY3RzIGNoYW5nZWQgcHJvcGVydGllcyB0byBhdHRyaWJ1dGVzIGFuZFxuICAgICAqIGRpc3BhdGNoZXMgY2hhbmdlIGV2ZW50cyBmb3IgcHJvcGVydGllcyB3aGljaCBhcmUgbWFya2VkIGZvciBub3RpZmljYXRpb24uXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHVwZGF0ZSAoKSB7XG5cbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAvLyByZWZsZWN0IGFsbCBwcm9wZXJ0aWVzIG1hcmtlZCBmb3IgcmVmbGVjdGlvblxuICAgICAgICB0aGlzLl9yZWZsZWN0aW5nUHJvcGVydGllcy5mb3JFYWNoKChvbGRWYWx1ZTogYW55LCBwcm9wZXJ0eUtleTogUHJvcGVydHlLZXkpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5yZWZsZWN0UHJvcGVydHkocHJvcGVydHlLZXksIG9sZFZhbHVlLCB0aGlzW3Byb3BlcnR5S2V5IGFzIGtleW9mIEN1c3RvbUVsZW1lbnRdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbm90aWZ5IGFsbCBwcm9wZXJ0aWVzIG1hcmtlZCBmb3Igbm90aWZpY2F0aW9uXG4gICAgICAgIHRoaXMuX25vdGlmeWluZ1Byb3BlcnRpZXMuZm9yRWFjaCgob2xkVmFsdWUsIHByb3BlcnR5S2V5KSA9PiB7XG5cbiAgICAgICAgICAgIHRoaXMubm90aWZ5UHJvcGVydHkocHJvcGVydHlLZXksIG9sZFZhbHVlLCB0aGlzW3Byb3BlcnR5S2V5IGFzIGtleW9mIEN1c3RvbUVsZW1lbnRdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy51cGRhdGVDYWxsYmFjayh0aGlzLl9jaGFuZ2VkUHJvcGVydGllcywgdGhpcy5faGFzVXBkYXRlZCk7XG5cbiAgICAgICAgdGhpcy5faGFzVXBkYXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgYSBwcm9wZXJ0eSBjaGFuZ2VkXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoaXMgbWV0aG9kIHJlc29sdmVzIHRoZSB7QGxpbmsgUHJvcGVydHlDaGFuZ2VEZXRlY3Rvcn0gZm9yIHRoZSBwcm9wZXJ0eSBhbmQgcmV0dXJucyBpdHMgcmVzdWx0LlxuICAgICAqIElmIG5vbmUgaXMgZGVmaW5lZCAodGhlIHByb3BlcnR5IGRlY2xhcmF0aW9uJ3Mgb2JzZXJ2ZSBvcHRpb24gaXMgYGZhbHNlYCkgaXQgcmV0dXJucyBmYWxzZS5cbiAgICAgKiBJdCBjYXRjaGVzIGFueSBlcnJvciBpbiBjdXN0b20ge0BsaW5rIFByb3BlcnR5Q2hhbmdlRGV0ZWN0b3J9cyBhbmQgdGhyb3dzIGEgbW9yZSBoZWxwZnVsIG9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAgIFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGNoZWNrXG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKiBAcmV0dXJucyAgICAgICAgICAgICBgdHJ1ZWAgaWYgdGhlIHByb3BlcnR5IGNoYW5nZWQsIGBmYWxzZWAgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGhhc0NoYW5nZWQgKHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSwgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5RGVjbGFyYXRpb24gPSB0aGlzLl9nZXRQcm9wZXJ0eURlY2xhcmF0aW9uKHByb3BlcnR5S2V5KTtcblxuICAgICAgICAvLyBvYnNlcnZlIGlzIGVpdGhlciBgZmFsc2VgIG9yIGEge0BsaW5rIFByb3BlcnR5Q2hhbmdlRGV0ZWN0b3J9XG4gICAgICAgIGlmIChwcm9wZXJ0eURlY2xhcmF0aW9uICYmIGlzUHJvcGVydHlDaGFuZ2VEZXRlY3Rvcihwcm9wZXJ0eURlY2xhcmF0aW9uLm9ic2VydmUpKSB7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5RGVjbGFyYXRpb24ub2JzZXJ2ZS5jYWxsKG51bGwsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBDSEFOR0VfREVURUNUT1JfRVJST1IocHJvcGVydHlEZWNsYXJhdGlvbi5vYnNlcnZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZsZWN0IGFuIGF0dHJpYnV0ZSB2YWx1ZSB0byBpdHMgYXNzb2NpYXRlZCBwcm9wZXJ0eVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIG1ldGhvZCBjaGVja3MsIGlmIGFueSBjdXN0b20ge0BsaW5rIEF0dHJpYnV0ZVJlZmxlY3Rvcn0gaGFzIGJlZW4gZGVmaW5lZCBmb3IgdGhlXG4gICAgICogYXNzb2NpYXRlZCBwcm9wZXJ0eSBhbmQgaW52b2tlcyB0aGUgYXBwcm9wcmlhdGUgcmVmbGVjdG9yLiBJZiBub3QsIGl0IHdpbGwgdXNlIHRoZSBkZWZhdWx0XG4gICAgICogcmVmbGVjdG9yIHtAbGluayBfcmVmbGVjdEF0dHJpYnV0ZX0uXG4gICAgICpcbiAgICAgKiBJdCBjYXRjaGVzIGFueSBlcnJvciBpbiBjdXN0b20ge0BsaW5rIEF0dHJpYnV0ZVJlZmxlY3Rvcn1zIGFuZCB0aHJvd3MgYSBtb3JlIGhlbHBmdWwgb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIGF0dHJpYnV0ZU5hbWUgVGhlIHByb3BlcnQga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byByZWZsZWN0XG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgcmVmbGVjdEF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbCwgbmV3VmFsdWU6IHN0cmluZyB8IG51bGwpIHtcblxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRoaXMuY29uc3RydWN0b3IgYXMgdHlwZW9mIEN1c3RvbUVsZW1lbnQ7XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSBjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzLmdldChhdHRyaWJ1dGVOYW1lKTtcblxuICAgICAgICAvLyBpZ25vcmUgdXNlci1kZWZpbmVkIG9ic2VydmVkIGF0dHJpYnV0ZXNcbiAgICAgICAgLy8gVE9ETzogdGVzdCB0aGlzXG4gICAgICAgIGlmICghcHJvcGVydHlLZXkpIHtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coYG9ic2VydmVkIGF0dHJpYnV0ZSBcIiR7IGF0dHJpYnV0ZU5hbWUgfVwiIG5vdCBmb3VuZC4uLiBpZ25vcmluZy4uLmApO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9wZXJ0eURlY2xhcmF0aW9uID0gdGhpcy5fZ2V0UHJvcGVydHlEZWNsYXJhdGlvbihwcm9wZXJ0eUtleSkhO1xuXG4gICAgICAgIC8vIGRvbid0IHJlZmxlY3QgaWYge0BsaW5rIHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZX0gaXMgZmFsc2VcbiAgICAgICAgaWYgKHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZSkge1xuXG4gICAgICAgICAgICB0aGlzLl9pc1JlZmxlY3RpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAoaXNBdHRyaWJ1dGVSZWZsZWN0b3IocHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0QXR0cmlidXRlKSkge1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0QXR0cmlidXRlLmNhbGwodGhpcywgYXR0cmlidXRlTmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcblxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgQVRUUklCVVRFX1JFRkxFQ1RPUl9FUlJPUihwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1Byb3BlcnR5S2V5KHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZSkpIHtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzW3Byb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZV0gYXMgQXR0cmlidXRlUmVmbGVjdG9yKShhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBBVFRSSUJVVEVfUkVGTEVDVE9SX0VSUk9SKHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9pc1JlZmxlY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZmxlY3QgYSBwcm9wZXJ0eSB2YWx1ZSB0byBpdHMgYXNzb2NpYXRlZCBhdHRyaWJ1dGVcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBtZXRob2QgY2hlY2tzLCBpZiBhbnkgY3VzdG9tIHtAbGluayBQcm9wZXJ0eVJlZmxlY3Rvcn0gaGFzIGJlZW4gZGVmaW5lZCBmb3IgdGhlXG4gICAgICogcHJvcGVydHkgYW5kIGludm9rZXMgdGhlIGFwcHJvcHJpYXRlIHJlZmxlY3Rvci4gSWYgbm90LCBpdCB3aWxsIHVzZSB0aGUgZGVmYXVsdFxuICAgICAqIHJlZmxlY3RvciB7QGxpbmsgX3JlZmxlY3RQcm9wZXJ0eX0uXG4gICAgICpcbiAgICAgKiBJdCBjYXRjaGVzIGFueSBlcnJvciBpbiBjdXN0b20ge0BsaW5rIFByb3BlcnR5UmVmbGVjdG9yfXMgYW5kIHRocm93cyBhIG1vcmUgaGVscGZ1bCBvbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgICBUaGUgcHJvcGVydCBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIHJlZmxlY3RcbiAgICAgKiBAcGFyYW0gb2xkVmFsdWUgICAgICBUaGUgb2xkIHByb3BlcnR5IHZhbHVlXG4gICAgICogQHBhcmFtIG5ld1ZhbHVlICAgICAgVGhlIG5ldyBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCByZWZsZWN0UHJvcGVydHkgKHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSwgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkge1xuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5RGVjbGFyYXRpb24gPSB0aGlzLl9nZXRQcm9wZXJ0eURlY2xhcmF0aW9uKHByb3BlcnR5S2V5KTtcblxuICAgICAgICAvLyBkb24ndCByZWZsZWN0IGlmIHtAbGluayBwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RQcm9wZXJ0eX0gaXMgZmFsc2VcbiAgICAgICAgaWYgKHByb3BlcnR5RGVjbGFyYXRpb24gJiYgcHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHkpIHtcblxuICAgICAgICAgICAgLy8gYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIGlzIGNhbGxlZCBzeW5jaHJvbm91c2x5LCB3ZSBjYW4gY2F0Y2ggdGhlIHN0YXRlIHRoZXJlXG4gICAgICAgICAgICB0aGlzLl9pc1JlZmxlY3RpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAoaXNQcm9wZXJ0eVJlZmxlY3Rvcihwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RQcm9wZXJ0eSkpIHtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdFByb3BlcnR5LmNhbGwodGhpcywgcHJvcGVydHlLZXksIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFBST1BFUlRZX1JFRkxFQ1RPUl9FUlJPUihwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RQcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzUHJvcGVydHlLZXkocHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHkpKSB7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAodGhpc1twcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RQcm9wZXJ0eV0gYXMgUHJvcGVydHlSZWZsZWN0b3IpKHByb3BlcnR5S2V5LCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBQUk9QRVJUWV9SRUZMRUNUT1JfRVJST1IocHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RQcm9wZXJ0eShwcm9wZXJ0eUtleSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faXNSZWZsZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSYWlzZSBhbiBldmVudCBmb3IgYSBwcm9wZXJ0eSBjaGFuZ2VcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBtZXRob2QgY2hlY2tzLCBpZiBhbnkgY3VzdG9tIHtAbGluayBQcm9wZXJ0eU5vdGlmaWVyfSBoYXMgYmVlbiBkZWZpbmVkIGZvciB0aGVcbiAgICAgKiBwcm9wZXJ0eSBhbmQgaW52b2tlcyB0aGUgYXBwcm9wcmlhdGUgbm90aWZpZXIuIElmIG5vdCwgaXQgd2lsbCB1c2UgdGhlIGRlZmF1bHRcbiAgICAgKiBub3RpZmllciB7QGxpbmsgX25vdGlmeVByb3BlcnR5fS5cbiAgICAgKlxuICAgICAqIEl0IGNhdGNoZXMgYW55IGVycm9yIGluIGN1c3RvbSB7QGxpbmsgUHJvcGVydHlSZWZsZWN0b3J9cyBhbmQgdGhyb3dzIGEgbW9yZSBoZWxwZnVsIG9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAgIFRoZSBwcm9wZXJ0IGtleSBvZiB0aGUgcHJvcGVydHkgdG8gcmFpc2UgYW4gZXZlbnQgZm9yXG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgbm90aWZ5UHJvcGVydHkgKHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSwgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkge1xuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5RGVjbGFyYXRpb24gPSB0aGlzLl9nZXRQcm9wZXJ0eURlY2xhcmF0aW9uKHByb3BlcnR5S2V5KTtcblxuICAgICAgICBpZiAocHJvcGVydHlEZWNsYXJhdGlvbiAmJiBwcm9wZXJ0eURlY2xhcmF0aW9uLm5vdGlmeSkge1xuXG4gICAgICAgICAgICBpZiAoaXNQcm9wZXJ0eU5vdGlmaWVyKHByb3BlcnR5RGVjbGFyYXRpb24ubm90aWZ5KSkge1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlEZWNsYXJhdGlvbi5ub3RpZnkuY2FsbCh0aGlzLCBwcm9wZXJ0eUtleSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcblxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgUFJPUEVSVFlfTk9USUZJRVJfRVJST1IocHJvcGVydHlEZWNsYXJhdGlvbi5ub3RpZnkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzUHJvcGVydHlLZXkocHJvcGVydHlEZWNsYXJhdGlvbi5ub3RpZnkpKSB7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAodGhpc1twcm9wZXJ0eURlY2xhcmF0aW9uLm5vdGlmeV0gYXMgUHJvcGVydHlOb3RpZmllcikocHJvcGVydHlLZXksIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFBST1BFUlRZX05PVElGSUVSX0VSUk9SKHByb3BlcnR5RGVjbGFyYXRpb24ubm90aWZ5KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9ub3RpZnlQcm9wZXJ0eShwcm9wZXJ0eUtleSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkZWZhdWx0IGF0dHJpYnV0ZSByZWZsZWN0b3JcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogSWYgbm8ge0BsaW5rIEF0dHJpYnV0ZVJlZmxlY3Rvcn0gaXMgZGVmaW5lZCBpbiB0aGUge0BsaW5rIFByb3BlcnR5RGVjbGFyYXRpb259IHRoaXNcbiAgICAgKiBtZXRob2QgaXMgdXNlZCB0byByZWZsZWN0IHRoZSBhdHRyaWJ1dGUgdmFsdWUgdG8gaXRzIGFzc29jaWF0ZWQgcHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXR0cmlidXRlTmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIHJlZmxlY3RcbiAgICAgKiBAcGFyYW0gb2xkVmFsdWUgICAgICBUaGUgb2xkIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgYXR0cmlidXRlIHZhbHVlXG4gICAgICpcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfcmVmbGVjdEF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nIHwgbnVsbCwgbmV3VmFsdWU6IHN0cmluZyB8IG51bGwpIHtcblxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRoaXMuY29uc3RydWN0b3IgYXMgdHlwZW9mIEN1c3RvbUVsZW1lbnQ7XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSBjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzLmdldChhdHRyaWJ1dGVOYW1lKSE7XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlEZWNsYXJhdGlvbiA9IHRoaXMuX2dldFByb3BlcnR5RGVjbGFyYXRpb24ocHJvcGVydHlLZXkpITtcblxuICAgICAgICBjb25zdCBwcm9wZXJ0eVZhbHVlID0gcHJvcGVydHlEZWNsYXJhdGlvbi5jb252ZXJ0ZXIuZnJvbUF0dHJpYnV0ZShuZXdWYWx1ZSk7XG5cbiAgICAgICAgdGhpc1twcm9wZXJ0eUtleSBhcyBrZXlvZiB0aGlzXSA9IHByb3BlcnR5VmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRlZmF1bHQgcHJvcGVydHkgcmVmbGVjdG9yXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIElmIG5vIHtAbGluayBQcm9wZXJ0eVJlZmxlY3Rvcn0gaXMgZGVmaW5lZCBpbiB0aGUge0BsaW5rIFByb3BlcnR5RGVjbGFyYXRpb259IHRoaXNcbiAgICAgKiBtZXRob2QgaXMgdXNlZCB0byByZWZsZWN0IHRoZSBwcm9wZXJ0eSB2YWx1ZSB0byBpdHMgYXNzb2NpYXRlZCBhdHRyaWJ1dGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgICBUaGUgcHJvcGVydHkga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byByZWZsZWN0XG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9yZWZsZWN0UHJvcGVydHkgKHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSwgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkge1xuXG4gICAgICAgIC8vIHRoaXMgZnVuY3Rpb24gaXMgb25seSBjYWxsZWQgZm9yIHByb3BlcnRpZXMgd2hpY2ggaGF2ZSBhIGRlY2xhcmF0aW9uXG4gICAgICAgIGNvbnN0IHByb3BlcnR5RGVjbGFyYXRpb24gPSB0aGlzLl9nZXRQcm9wZXJ0eURlY2xhcmF0aW9uKHByb3BlcnR5S2V5KSE7XG5cbiAgICAgICAgLy8gVE9ETzogdGVzdCB3aGF0IGhhcHBlbnMgaWYgYXR0cmlidXRlIGlzIHNldCB0byBmYWxzZSBidXQgcmVmbGVjdFByb3BlcnR5IGlzIHRydWUhXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBwcm9wZXJ0eURlY2xhcmF0aW9uLmF0dHJpYnV0ZSBhcyBzdHJpbmc7XG4gICAgICAgIC8vIHJlc29sdmUgdGhlIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IHByb3BlcnR5RGVjbGFyYXRpb24uY29udmVydGVyLnRvQXR0cmlidXRlKG5ld1ZhbHVlKTtcblxuICAgICAgICAvLyB1bmRlZmluZWQgbWVhbnMgZG9uJ3QgY2hhbmdlXG4gICAgICAgIGlmIChhdHRyaWJ1dGVWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBudWxsIG1lYW5zIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICAgICAgIGVsc2UgaWYgKGF0dHJpYnV0ZVZhbHVlID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3BhdGNoIGEgcHJvcGVydHktY2hhbmdlZCBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5XG4gICAgICogQHBhcmFtIG9sZFZhbHVlXG4gICAgICogQHBhcmFtIG5ld1ZhbHVlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9ub3RpZnlQcm9wZXJ0eSAocHJvcGVydHlLZXk6IFByb3BlcnR5S2V5LCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgZXZlbnROYW1lID0gY3JlYXRlRXZlbnROYW1lKHByb3BlcnR5S2V5LCAnJywgJ2NoYW5nZWQnKTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICAgICAgY29tcG9zZWQ6IHRydWUsXG4gICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHlLZXksXG4gICAgICAgICAgICAgICAgcHJldmlvdXM6IG9sZFZhbHVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IG5ld1ZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaCBhIGxpZmVjeWNsZSBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGxpZmVjeWNsZSBUaGUgbGlmZWN5Y2xlIGZvciB3aGljaCB0byByYWlzZSB0aGUgZXZlbnRcbiAgICAgKiBAcGFyYW0gZGV0YWlsICAgIE9wdGlvbmFsIGV2ZW50IGRldGFpbHNcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX25vdGlmeUxpZmVjeWNsZSAobGlmZWN5Y2xlOiBzdHJpbmcsIGRldGFpbD86IG9iamVjdCkge1xuXG4gICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGNyZWF0ZUV2ZW50TmFtZShsaWZlY3ljbGUsICdvbicpO1xuXG4gICAgICAgIGNvbnN0IGV2ZW50SW5pdCA9IHtcbiAgICAgICAgICAgIGNvbXBvc2VkOiB0cnVlLFxuICAgICAgICAgICAgLi4uKGRldGFpbCA/IHsgZGV0YWlsOiBkZXRhaWwgfSA6IHt9KVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCBldmVudEluaXQpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCaW5kIGN1c3RvbSBlbGVtZW50IGxpc3RlbmVycy5cbiAgICAgKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9saXN0ZW4gKCkge1xuXG4gICAgICAgICh0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDdXN0b21FbGVtZW50KS5saXN0ZW5lcnMuZm9yRWFjaCgoZGVjbGFyYXRpb24sIGxpc3RlbmVyKSA9PiB7XG5cbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlRGVjbGFyYXRpb246IEluc3RhbmNlTGlzdGVuZXJEZWNsYXJhdGlvbiA9IHtcblxuICAgICAgICAgICAgICAgIC8vIGNvcHkgdGhlIGNsYXNzJ3Mgc3RhdGljIGxpc3RlbmVyIGRlY2xhcmF0aW9uIGludG8gYW4gaW5zdGFuY2UgbGlzdGVuZXIgZGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICBldmVudDogZGVjbGFyYXRpb24uZXZlbnQsXG4gICAgICAgICAgICAgICAgb3B0aW9uczogZGVjbGFyYXRpb24ub3B0aW9ucyxcblxuICAgICAgICAgICAgICAgIC8vIGJpbmQgdGhlIGNvbXBvbmVudHMgbGlzdGVuZXIgbWV0aG9kIHRvIHRoZSBjb21wb25lbnQgaW5zdGFuY2UgYW5kIHN0b3JlIGl0IGluIHRoZSBpbnN0YW5jZSBkZWNsYXJhdGlvblxuICAgICAgICAgICAgICAgIGxpc3RlbmVyOiAodGhpc1tsaXN0ZW5lciBhcyBrZXlvZiB0aGlzXSBhcyB1bmtub3duIGFzIEV2ZW50TGlzdGVuZXIpLmJpbmQodGhpcyksXG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUgdGhlIGV2ZW50IHRhcmdldCBhbmQgc3RvcmUgaXQgaW4gdGhlIGluc3RhbmNlIGRlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAoZGVjbGFyYXRpb24udGFyZ2V0KSA/XG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgZGVjbGFyYXRpb24udGFyZ2V0ID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbi50YXJnZXQoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbi50YXJnZXQgOlxuICAgICAgICAgICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBhZGQgdGhlIGJvdW5kIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSB0YXJnZXRcbiAgICAgICAgICAgIGluc3RhbmNlRGVjbGFyYXRpb24udGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoaW5zdGFuY2VEZWNsYXJhdGlvbi5ldmVudCBhcyBzdHJpbmcsIGluc3RhbmNlRGVjbGFyYXRpb24ubGlzdGVuZXIsIGluc3RhbmNlRGVjbGFyYXRpb24ub3B0aW9ucyk7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgdGhlIGluc3RhbmNlIGxpc3RlbmVyIGRlY2xhcmF0aW9uIG9uIHRoZSBjb21wb25lbnQgaW5zdGFuY2VcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyRGVjbGFyYXRpb25zLnB1c2goaW5zdGFuY2VEZWNsYXJhdGlvbik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVuYmluZCBjdXN0b20gZWxlbWVudCBsaXN0ZW5lcnMuXG4gICAgICpcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfdW5saXN0ZW4gKCkge1xuXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyRGVjbGFyYXRpb25zLmZvckVhY2goKGRlY2xhcmF0aW9uKSA9PiB7XG5cbiAgICAgICAgICAgIGRlY2xhcmF0aW9uLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGRlY2xhcmF0aW9uLmV2ZW50IGFzIHN0cmluZywgZGVjbGFyYXRpb24ubGlzdGVuZXIsIGRlY2xhcmF0aW9uLm9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY2hlZHVsZSB0aGUgdXBkYXRlIG9mIHRoZSBjdXN0b20gZWxlbWVudFxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBTY2hlZHVsZXMgdGhlIHVwZGF0ZSBvZiB0aGUgY3VzdG9tIGVsZW1lbnQganVzdCBiZWZvcmUgdGhlIG5leHQgZnJhbWVcbiAgICAgKiBhbmQgY2xlYW5zIHVwIHRoZSBjdXN0b20gZWxlbWVudHMgc3RhdGUgYWZ0ZXJ3YXJkcy5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3NjaGVkdWxlVXBkYXRlICgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG5cbiAgICAgICAgICAgIC8vIHNjaGVkdWxlIHRoZSB1cGRhdGUgdmlhIHJlcXVlc3RBbmltYXRpb25GcmFtZSB0byBhdm9pZCBtdWx0aXBsZSByZWRyYXdzIHBlciBmcmFtZVxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9jaGFuZ2VkUHJvcGVydGllcyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RpbmdQcm9wZXJ0aWVzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fbm90aWZ5aW5nUHJvcGVydGllcyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAgICAgICAgIC8vIG1hcmsgY3VzdG9tIGVsZW1lbnQgYXMgdXBkYXRlZCBhZnRlciB0aGUgdXBkYXRlIHRvIHByZXZlbnQgaW5maW50ZSBsb29wcyBpbiB0aGUgdXBkYXRlIHByb2Nlc3NcbiAgICAgICAgICAgICAgICAvLyBOLkIuOiBhbnkgcHJvcGVydHkgY2hhbmdlcyBkdXJpbmcgdGhlIHVwZGF0ZSB3aWxsIGJlIGlnbm9yZWRcbiAgICAgICAgICAgICAgICB0aGlzLl9oYXNSZXF1ZXN0ZWRVcGRhdGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbnF1ZXVlIGEgcmVxdWVzdCBmb3IgYW4gYXN5bmNocm9ub3VzIHVwZGF0ZVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgX2VucXVldWVVcGRhdGUgKCkge1xuXG4gICAgICAgIGxldCByZXNvbHZlOiAocmVzdWx0OiBib29sZWFuKSA9PiB2b2lkO1xuXG4gICAgICAgIGNvbnN0IHByZXZpb3VzUmVxdWVzdCA9IHRoaXMuX3VwZGF0ZVJlcXVlc3Q7XG5cbiAgICAgICAgLy8gbWFyayB0aGUgY3VzdG9tIGVsZW1lbnQgYXMgaGF2aW5nIHJlcXVlc3RlZCBhbiB1cGRhdGUsIHRoZSB7QGxpbmsgX3JlcXVlc3RVcGRhdGV9IG1ldGhvZFxuICAgICAgICAvLyB3aWxsIG5vdCBlbnF1ZXVlIGEgZnVydGhlciByZXF1ZXN0IGZvciB1cGRhdGUgaWYgb25lIGlzIHNjaGVkdWxlZFxuICAgICAgICB0aGlzLl9oYXNSZXF1ZXN0ZWRVcGRhdGUgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVJlcXVlc3QgPSBuZXcgUHJvbWlzZTxib29sZWFuPihyZXMgPT4gcmVzb2x2ZSA9IHJlcyk7XG5cbiAgICAgICAgLy8gd2FpdCBmb3IgdGhlIHByZXZpb3VzIHVwZGF0ZSB0byByZXNvbHZlXG4gICAgICAgIC8vIGBhd2FpdGAgaXMgYXN5bmNocm9ub3VzIGFuZCB3aWxsIHJldHVybiBleGVjdXRpb24gdG8gdGhlIHtAbGluayByZXF1ZXN0VXBkYXRlfSBtZXRob2RcbiAgICAgICAgLy8gYW5kIGVzc2VudGlhbGx5IGFsbG93cyB1cyB0byBiYXRjaCBtdWx0aXBsZSBzeW5jaHJvbm91cyBwcm9wZXJ0eSBjaGFuZ2VzLCBiZWZvcmUgdGhlXG4gICAgICAgIC8vIGV4ZWN1dGlvbiBjYW4gcmVzdW1lIGhlcmVcbiAgICAgICAgYXdhaXQgcHJldmlvdXNSZXF1ZXN0O1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX3NjaGVkdWxlVXBkYXRlKCk7XG5cbiAgICAgICAgLy8gdGhlIGFjdHVhbCB1cGRhdGUgaXMgc2NoZWR1bGVkIGFzeW5jaHJvbm91c2x5IGFzIHdlbGxcbiAgICAgICAgYXdhaXQgcmVzdWx0O1xuXG4gICAgICAgIC8vIHJlc29sdmUgdGhlIG5ldyB7QGxpbmsgX3VwZGF0ZVJlcXVlc3R9IGFmdGVyIHRoZSByZXN1bHQgb2YgdGhlIGN1cnJlbnQgdXBkYXRlIHJlc29sdmVzXG4gICAgICAgIHJlc29sdmUhKCF0aGlzLl9oYXNSZXF1ZXN0ZWRVcGRhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHtAbGluayBQcm9wZXJ0eURlY2xhcmF0aW9ufSBmb3IgYSBkZWNvcmF0ZWQgcHJvcGVydHlcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSBUaGUgcHJvcGVydHkga2V5IGZvciB3aGljaCB0byByZXRyaWV2ZSB0aGUgZGVjbGFyYXRpb25cbiAgICAgKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBfZ2V0UHJvcGVydHlEZWNsYXJhdGlvbiAocHJvcGVydHlLZXk6IFByb3BlcnR5S2V5KTogUHJvcGVydHlEZWNsYXJhdGlvbiB8IHVuZGVmaW5lZCB7XG5cbiAgICAgICAgcmV0dXJuICh0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDdXN0b21FbGVtZW50KS5wcm9wZXJ0aWVzLmdldChwcm9wZXJ0eUtleSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ3VzdG9tRWxlbWVudCB9IGZyb20gJy4uL2N1c3RvbS1lbGVtZW50JztcbmltcG9ydCB7IERlY29yYXRlZEN1c3RvbUVsZW1lbnRUeXBlIH0gZnJvbSAnLi9wcm9wZXJ0eSc7XG5cbi8qKlxuICogQSB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gZGVjbGFyYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDdXN0b21FbGVtZW50RGVjbGFyYXRpb24ge1xuICAgIC8qKlxuICAgICAqIFRoZSBzZWxlY3RvciBvZiB0aGUgY3VzdG9tIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhlIHNlbGVjdG9yIHdpbGwgYmUgdXNlZCB0byByZWdpc3RlciB0aGUgY3VzdG9tIGVsZW1lbnQgY29uc3RydWN0b3Igd2l0aCB0aGUgYnJvd3NlcidzXG4gICAgICoge0BsaW5rIHdpbmRvdy5jdXN0b21FbGVtZW50c30gQVBJLiBJZiBubyBzZWxlY3RvciBpcyBzcGVjaWZpZWQsIHRoZSBjdXN0b20gZWxlbWVudCBjbGFzc1xuICAgICAqIG5lZWRzIHRvIHByb3ZpZGUgb25lIGluIGl0cyBzdGF0aWMge0BsaW5rIEN1c3RvbUVsZW1lbnQuc2VsZWN0b3J9IHByb3BlcnR5LlxuICAgICAqIEEgc2VsZWN0b3IgZGVmaW5lZCBpbiB0aGUge0BsaW5rIEN1c3RvbUVsZW1lbnREZWNsYXJhdGlvbn0gd2lsbCB0YWtlIHByZWNlZGVuY2Ugb3ZlciB0aGVcbiAgICAgKiBzdGF0aWMgY2xhc3MgcHJvcGVydHkuXG4gICAgICovXG4gICAgc2VsZWN0b3I6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFVzZSBTaGFkb3cgRE9NIHRvIHJlbmRlciB0aGUgY3VzdG9tIGVsZW1lbnRzIHRlbXBsYXRlP1xuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBTaGFkb3cgRE9NIGNhbiBiZSBkaXNhYmxlZCBieSBzZXR0aW5nIHRoaXMgb3B0aW9uIHRvIGBmYWxzZWAsIGluIHdoaWNoIGNhc2UgdGhlIGN1c3RvbVxuICAgICAqIGVsZW1lbnQncyB0ZW1wbGF0ZSB3aWxsIGJlIHJlbmRlcmVkIGFzIGNoaWxkIG5vZGVzIG9mIHRoZSBjdXN0b20gZWxlbWVudC4gVGhpcyBjYW4gYmVcbiAgICAgKiB1c2VmdWwgaWYgYW4gaXNvbGF0ZWQgRE9NIGFuZCBzY29wZWQgQ1NTIGlzIG5vdCBkZXNpcmVkLlxuICAgICAqXG4gICAgICogRGVmYXVsdCB2YWx1ZTogYHRydWVgXG4gICAgICovXG4gICAgc2hhZG93OiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogQXV0b21hdGljYWxseSByZWdpc3RlciB0aGUgY3VzdG9tIGVsZW1lbnQgd2l0aCB0aGUgYnJvd3NlcidzIHtAbGluayB3aW5kb3cuY3VzdG9tRWxlbWVudHN9IEFQST9cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogSW4gY2FzZXMgd2hlcmUgeW91IHdhbnQgdG8gZW1wbG95IGEgbW9kdWxlIHN5c3RlbSB3aGljaCByZWdpc3RlcnMgY3VzdG9tIGVsZW1lbnRzIG9uXG4gICAgICogYSBjb25kaXRpb25hbCBiYXNpcywgeW91IGNhbiBkaXNhYmxlIGF1dG9tYXRpYyByZWdpc3RyYXRpb24gYnkgc2V0dGluZyB0aGlzIG9wdGlvbiB0b1xuICAgICAqIGBmYWxzZWAuIFlvdXIgbW9kdWxlIG9yIGJvb3RzdHJhcCBzeXN0ZW0gd2lsbCBoYXZlIHRvIHRha2UgY2FyZSBvZiBkZWZpbmluZyB0aGUgY3VzdG9tXG4gICAgICogZWxlbWVudCBsYXRlci5cbiAgICAgKlxuICAgICAqIERlZmF1bHQgdmFsdWU6IGB0cnVlYFxuICAgICAqL1xuICAgIGRlZmluZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ1VTVE9NX0VMRU1FTlRfREVDTEFSQVRJT046IEN1c3RvbUVsZW1lbnREZWNsYXJhdGlvbiA9IHtcbiAgICBzZWxlY3RvcjogJycsXG4gICAgc2hhZG93OiB0cnVlLFxuICAgIGRlZmluZTogdHJ1ZVxufTtcblxuLyoqXG4gKiBEZWNvcmF0ZXMgYSB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gY2xhc3NcbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBBIGN1c3RvbSBlbGVtZW50IGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBjdXN0b21FbGVtZW50ID0gKG9wdGlvbnM6IFBhcnRpYWw8Q3VzdG9tRWxlbWVudERlY2xhcmF0aW9uPiA9IHt9KSA9PiB7XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbiA9IHsgLi4uREVGQVVMVF9DVVNUT01fRUxFTUVOVF9ERUNMQVJBVElPTiwgLi4ub3B0aW9ucyB9O1xuXG4gICAgcmV0dXJuICh0YXJnZXQ6IHR5cGVvZiBDdXN0b21FbGVtZW50KSA9PiB7XG5cbiAgICAgICAgY29uc3QgY29uc3RydWN0b3IgPSB0YXJnZXQgYXMgRGVjb3JhdGVkQ3VzdG9tRWxlbWVudFR5cGU7XG5cbiAgICAgICAgY29uc3RydWN0b3Iuc2VsZWN0b3IgPSBkZWNsYXJhdGlvbi5zZWxlY3RvciB8fCB0YXJnZXQuc2VsZWN0b3I7XG4gICAgICAgIGNvbnN0cnVjdG9yLnNoYWRvdyA9IGRlY2xhcmF0aW9uLnNoYWRvdztcblxuICAgICAgICAvKipcbiAgICAgICAgICogUHJvcGVydHkgZGVjb3JhdG9ycyBnZXQgY2FsbGVkIGJlZm9yZSBjbGFzcyBkZWNvcmF0b3JzLCBzbyBhdCB0aGlzIHBvaW50IGFsbCBkZWNvcmF0ZWQgcHJvcGVydGllc1xuICAgICAgICAgKiBoYXZlIHN0b3JlZCB0aGVpciBhc3NvY2lhdGVkIGF0dHJpYnV0ZXMgaW4ge0BsaW5rIEN1c3RvbUVsZW1lbnQuYXR0cmlidXRlc30uXG4gICAgICAgICAqIFdlIGNhbiBub3cgY29tYmluZSB0aGVtIHdpdGggdGhlIHVzZXItZGVmaW5lZCB7QGxpbmsgQ3VzdG9tRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXN9IGFuZCxcbiAgICAgICAgICogYnkgdXNpbmcgYSBTZXQsIGVsaW1pbmF0ZSBhbGwgZHVwbGljYXRlcyBpbiB0aGUgcHJvY2Vzcy5cbiAgICAgICAgICpcbiAgICAgICAgICogQXMgdGhlIHVzZXItZGVmaW5lZCB7QGxpbmsgQ3VzdG9tRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXN9IHdpbGwgYWxzbyBpbmNsdWRlIGRlY29yYXRvciBnZW5lcmF0ZWRcbiAgICAgICAgICogb2JzZXJ2ZWQgYXR0cmlidXRlcywgd2UgYWx3YXlzIGluaGVyaXQgYWxsIG9ic2VydmVkIGF0dHJpYnV0ZXMgZnJvbSBhIGJhc2UgY2xhc3MuIEZvciB0aGF0IHJlYXNvblxuICAgICAgICAgKiB3ZSBoYXZlIHRvIGtlZXAgdHJhY2sgb2YgYXR0cmlidXRlIG92ZXJyaWRlcyB3aGVuIGV4dGVuZGluZyBhbnkge0BsaW5rIEN1c3RvbUVsZW1lbnR9IGJhc2UgY2xhc3MuXG4gICAgICAgICAqIFRoaXMgaXMgZG9uZSBpbiB0aGUge0BsaW5rIHByb3BlcnR5fSBkZWNvcmF0b3IuIEhlcmUgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdG8gcmVtb3ZlIG92ZXJyaWRkZW5cbiAgICAgICAgICogYXR0cmlidXRlcy5cbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IG9ic2VydmVkQXR0cmlidXRlcyA9IFtcbiAgICAgICAgICAgIC4uLm5ldyBTZXQoXG4gICAgICAgICAgICAgICAgLy8gd2UgdGFrZSB0aGUgaW5oZXJpdGVkIG9ic2VydmVkIGF0dHJpYnV0ZXMuLi5cbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3Rvci5vYnNlcnZlZEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICAgICAgLy8gLi4ucmVtb3ZlIG92ZXJyaWRkZW4gZ2VuZXJhdGVkIGF0dHJpYnV0ZXMuLi5cbiAgICAgICAgICAgICAgICAgICAgLnJlZHVjZSgoYXR0cmlidXRlcywgYXR0cmlidXRlKSA9PiBhdHRyaWJ1dGVzLmNvbmNhdChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yLm92ZXJyaWRkZW4gJiYgY29uc3RydWN0b3Iub3ZlcnJpZGRlbi5oYXMoYXR0cmlidXRlKSA/IFtdIDogYXR0cmlidXRlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtdIGFzIHN0cmluZ1tdXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLy8gLi4uYW5kIHJlY29tYmluZSB0aGUgbGlzdCB3aXRoIHRoZSBuZXdseSBnZW5lcmF0ZWQgYXR0cmlidXRlcyAodGhlIFNldCBwcmV2ZW50cyBkdXBsaWNhdGVzKVxuICAgICAgICAgICAgICAgICAgICAuY29uY2F0KFsuLi50YXJnZXQuYXR0cmlidXRlcy5rZXlzKCldKVxuICAgICAgICAgICAgKVxuICAgICAgICBdO1xuXG4gICAgICAgIC8vIFRPRE86IGRlbGV0ZSB0aGUgb3ZlcnJpZGRlbiBTZXQgZnJvbSB0aGUgY29uc3RydWN0b3JcblxuICAgICAgICAvKipcbiAgICAgICAgICogRmluYWxseSB3ZSBvdmVycmlkZSB0aGUge0BsaW5rIEN1c3RvbUVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzfSBnZXR0ZXIgd2l0aCBhIG5ldyBvbmUsIHdoaWNoIHJldHVybnNcbiAgICAgICAgICogdGhlIHVuaXF1ZSBzZXQgb2YgdXNlciBkZWZpbmVkIGFuZCBkZWNvcmF0b3IgZ2VuZXJhdGVkIG9ic2VydmVkIGF0dHJpYnV0ZXMuXG4gICAgICAgICAqXG4gICAgICAgICAqIE4uQi46IFdoZW4gZXh0ZW5kaW5nIGFuIGV4aXN0aW5nIGN1c3RvbSBlbGVtZW50LCBhbmQgb2VycmlkaW5nIGEgcHJvcGVydHkgd2l0aCBhIGRpZmZlcmVudCBhc3NvY2lhdGVkXG4gICAgICAgICAqIGF0dHJpYnV0ZSBuYW1lLCB0aGUgYmFzZSBjbGFzcydzIG9yaWdpbmFsIGF0dHJpYnV0ZSBuYW1lIHJlbWFpbnMgaW4gdGhlIHtAbGluayBDdXN0b21FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc31cbiAgICAgICAgICogYXJyYXkuIENoYW5naW5nIHRoZSBvbGQgYXR0cmlidXRlIG9uIHRoZSBleHRlbmRlZCBjbGFzcyB3aWxsIHRyeSB0byByZWZsZWN0IHRoZSBhdHRyaWJ1dGUsIGJ1dCB3b24ndFxuICAgICAgICAgKiBmaW5kIHRoZSBhdHRyaWJ1dGUgaW4gdGhlIGV4dGVuZGVkIGNsYXNzJ3Mge0BsaW5rIEN1c3RvbUVsZW1lbnQuYXR0cmlidXRlc30gTWFwIGFuZCB3aWxsIHRoZXJlZm9yZSBiZVxuICAgICAgICAgKiBpZ25vcmVkLlxuICAgICAgICAgKi9cbiAgICAgICAgUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eShjb25zdHJ1Y3RvciwgJ29ic2VydmVkQXR0cmlidXRlcycsIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZ2V0ICgpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ic2VydmVkQXR0cmlidXRlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uLmRlZmluZSkge1xuXG4gICAgICAgICAgICB3aW5kb3cuY3VzdG9tRWxlbWVudHMuZGVmaW5lKGNvbnN0cnVjdG9yLnNlbGVjdG9yLCBjb25zdHJ1Y3Rvcik7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbiIsImltcG9ydCB7IEN1c3RvbUVsZW1lbnQgfSBmcm9tICcuLi9jdXN0b20tZWxlbWVudCc7XG5cbi8qKlxuICogQSB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gZXZlbnQgbGlzdGVuZXIgZGVjbGFyYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lckRlY2xhcmF0aW9uIHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBldmVudCB0byBsaXN0ZW4gdG9cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogU2V0dGluZyBldmVudCB0byBgbnVsbGAgYWxsb3dzIHRvIHVuYmluZCBhbiBpbmhlcml0ZWQgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgZXZlbnQ6IHN0cmluZyB8IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBBbiBvcHRpb25zIG9iamVjdCB0aGF0IHNwZWNpZmllcyBjaGFyYWN0ZXJpc3RpY3MgYWJvdXQgdGhlIGV2ZW50IGxpc3RlbmVyXG4gICAgICovXG4gICAgb3B0aW9ucz86IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zO1xuXG4gICAgLyoqXG4gICAgICogQW4gYWx0ZXJuYXRpdmUgZXZlbnQgdGFyZ2V0IChieSBkZWZhdWx0IHRoaXMgd2lsbCBiZSB0aGUge0BsaW5rIEN1c3RvbUVsZW1lbnR9IGluc3RhbmNlKVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIGNhbiBiZSB1c2VmdWwgaWYgeW91IHdhbnQgdG8gbGlzdGVuIHRvIGUuZy46XG4gICAgICogKiB3aW5kb3cub25yZXNpemVcbiAgICAgKiAqIGRvY3VtZW50Lm9ubG9hZFxuICAgICAqICogZG9jdW1lbnQub25zY3JvbGxcbiAgICAgKiAqIFdvcmtlci5vbm1lc3NhZ2UgLSBUT0RPOiBUaGlzIGNvdWxkIGJlIGludGVyZXN0aW5nIHRvIHNvbHZlLCB3ZSBtaWdodCBuZWVkIHRvIGdldCB0aGUgd29ya2VyIGZyb20gdGhlXG4gICAgICogICBjb21wb25lbnQgaW5zdGFuY2UsIG1heWJlIGEgdXNlIGNhc2UgZm9yIGRpIEBzZWxmKClcbiAgICAgKi9cbiAgICB0YXJnZXQ/OiBFdmVudFRhcmdldCB8ICgoKSA9PiBFdmVudFRhcmdldCk7XG59XG5cbi8qKlxuICogRGVjb3JhdGVzIGEge0BsaW5rIEN1c3RvbUVsZW1lbnR9IG1ldGhvZCBhcyBhbiBldmVudCBsaXN0ZW5lclxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBsaXN0ZW5lciBkZWNsYXJhdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuZXIgKG9wdGlvbnM6IExpc3RlbmVyRGVjbGFyYXRpb24pIHtcblxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcsIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcikge1xuXG4gICAgICAgIGNvbnN0IGNvbnN0cnVjdG9yID0gdGFyZ2V0LmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDdXN0b21FbGVtZW50O1xuXG4gICAgICAgIHByZXBhcmVDb25zdHJ1Y3Rvcihjb25zdHJ1Y3Rvcik7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZXZlbnQgPT09IG51bGwpIHtcblxuICAgICAgICAgICAgY29uc3RydWN0b3IubGlzdGVuZXJzLmRlbGV0ZShwcm9wZXJ0eUtleSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgY29uc3RydWN0b3IubGlzdGVuZXJzLnNldChwcm9wZXJ0eUtleSwgeyAuLi5vcHRpb25zIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFByZXBhcmVzIHRoZSBjdXN0b20gZWxlbWVudCBjb25zdHJ1Y3RvciBieSBpbml0aWFsaXppbmcgc3RhdGljIHByb3BlcnRpZXMgZm9yIHRoZSBsaXN0ZW5lciBkZWNvcmF0b3IsXG4gKiBzbyB3ZSBkb24ndCBtb2RpZnkgYSBiYXNlIGNsYXNzJ3Mgc3RhdGljIHByb3BlcnRpZXMuXG4gKlxuICogQHJlbWFya3NcbiAqIFdoZW4gdGhlIGxpc3RlbmVyIGRlY29yYXRvciBzdG9yZXMgbGlzdGVuZXIgZGVjbGFyYXRpb25zIGluIHRoZSBjb25zdHJ1Y3Rvciwgd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhlXG4gKiBzdGF0aWMgbGlzdGVuZXJzIGZpZWxkIGlzIGluaXRpYWxpemVkIG9uIHRoZSBjdXJyZW50IGNvbnN0cnVjdG9yLiBPdGhlcndpc2Ugd2UgYWRkIGxpc3RlbmVyIGRlY2xhcmF0aW9uc1xuICogdG8gdGhlIGJhc2UgY2xhc3MncyBzdGF0aWMgZmllbGQuIFdlIGFsc28gbWFrZSBzdXJlIHRvIGluaXRpYWxpemUgdGhlIGxpc3RlbmVyIG1hcHMgd2l0aCB0aGUgdmFsdWVzIG9mXG4gKiB0aGUgYmFzZSBjbGFzcydzIG1hcCB0byBwcm9wZXJseSBpbmhlcml0IGFsbCBsaXN0ZW5lciBkZWNsYXJhdGlvbnMuXG4gKlxuICogQHBhcmFtIGNvbnN0cnVjdG9yIFRoZSBjdXN0b20gZWxlbWVudCBjb25zdHJ1Y3RvciB0byBwcmVwYXJlXG4gKlxuICogQGludGVybmFsXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwcmVwYXJlQ29uc3RydWN0b3IgKGNvbnN0cnVjdG9yOiB0eXBlb2YgQ3VzdG9tRWxlbWVudCkge1xuXG4gICAgaWYgKCFjb25zdHJ1Y3Rvci5oYXNPd25Qcm9wZXJ0eSgnbGlzdGVuZXJzJykpIGNvbnN0cnVjdG9yLmxpc3RlbmVycyA9IG5ldyBNYXAoY29uc3RydWN0b3IubGlzdGVuZXJzKTtcbn1cbiIsIi8qKlxuICogR2V0IHRoZSB7QGxpbmsgUHJvcGVydHlEZXNjcmlwdG9yfSBvZiBhIHByb3BlcnR5IGZyb20gaXRzIHByb3RvdHlwZVxuICogb3IgYSBwYXJlbnQgcHJvdG90eXBlIC0gZXhjbHVkaW5nIHtAbGluayBPYmplY3QucHJvdG90eXBlfSBpdHNlbGYsIHRvXG4gKiBlbnN1cmUgY29ycmVjdCBwcm90b3R5cGUgaW5oZXJpdGFuY2UuXG4gKlxuICogQHBhcmFtIHRhcmdldCAgICAgICAgVGhlIHByb3RvdHlwZSB0byBnZXQgdGhlIGRlc2NyaXB0b3IgZnJvbVxuICogQHBhcmFtIHByb3BlcnR5S2V5ICAgVGhlIHByb3BlcnR5IGtleSBmb3Igd2hpY2ggdG8gZ2V0IHRoZSBkZXNjcmlwdG9yXG4gKlxuICogQGludGVybmFsXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcGVydHlEZXNjcmlwdG9yICh0YXJnZXQ6IE9iamVjdCwgcHJvcGVydHlLZXk6IFByb3BlcnR5S2V5KTogUHJvcGVydHlEZXNjcmlwdG9yIHwgdW5kZWZpbmVkIHtcblxuICAgIGlmIChwcm9wZXJ0eUtleSBpbiB0YXJnZXQpIHtcblxuICAgICAgICB3aGlsZSAodGFyZ2V0ICE9PSBPYmplY3QucHJvdG90eXBlKSB7XG5cbiAgICAgICAgICAgIGlmICh0YXJnZXQuaGFzT3duUHJvcGVydHkocHJvcGVydHlLZXkpKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGFyZ2V0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuIiwiaW1wb3J0IHsgQ3VzdG9tRWxlbWVudCB9IGZyb20gJy4uL2N1c3RvbS1lbGVtZW50JztcbmltcG9ydCB7IGdldFByb3BlcnR5RGVzY3JpcHRvciB9IGZyb20gJy4vZ2V0LXByb3BlcnR5LWRlc2NyaXB0b3InO1xuaW1wb3J0IHsgY3JlYXRlQXR0cmlidXRlTmFtZSwgREVGQVVMVF9QUk9QRVJUWV9ERUNMQVJBVElPTiwgUHJvcGVydHlEZWNsYXJhdGlvbiB9IGZyb20gJy4vcHJvcGVydHktZGVjbGFyYXRpb24nO1xuXG4vKipcbiAqIEEgdHlwZSBleHRlbnNpb24gdG8gYWRkIGFkZGl0aW9uYWwgcHJvcGVydGllcyB0byBhIHtAbGluayBDdXN0b21FbGVtZW50fSBjb25zdHJ1Y3RvciBkdXJpbmcgZGVjb3JhdGlvblxuICpcbiAqIEBpbnRlcm5hbFxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IHR5cGUgRGVjb3JhdGVkQ3VzdG9tRWxlbWVudFR5cGUgPSB0eXBlb2YgQ3VzdG9tRWxlbWVudCAmIHsgb3ZlcnJpZGRlbj86IFNldDxzdHJpbmc+IH07XG5cbi8qKlxuICogRGVjb3JhdGVzIGEge0BsaW5rIEN1c3RvbUVsZW1lbnR9IHByb3BlcnR5XG4gKlxuICogQHJlbWFya3NcbiAqIE1hbnkgb2YgdGhlIHtAbGluayBQcm9wZXJ0eURlY2xhcmF0aW9ufSBvcHRpb25zIHN1cHBvcnQgY3VzdG9tIGZ1bmN0aW9ucywgd2hpY2ggd2lsbCBiZSBpbnZva2VkXG4gKiB3aXRoIHRoZSBjdXN0b20gZWxlbWVudCBpbnN0YW5jZSBhcyBgdGhpc2AtY29udGV4dCBkdXJpbmcgZXhlY3V0aW9uLiBJbiBvcmRlciB0byBzdXBwb3J0IGNvcnJlY3RcbiAqIHR5cGluZyBpbiB0aGVzZSBmdW5jdGlvbnMsIHRoZSBgQHByb3BlcnR5YCBkZWNvcmF0b3Igc3VwcG9ydHMgZ2VuZXJpYyB0eXBlcy4gSGVyZSBpcyBhbiBleGFtcGxlXG4gKiBvZiBob3cgeW91IGNhbiB1c2UgdGhpcyB3aXRoIGEgY3VzdG9tIHtAbGluayBQcm9wZXJ0eVJlZmxlY3Rvcn06XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gKlxuICogICAgICBteUhpZGRlblByb3BlcnR5ID0gdHJ1ZTtcbiAqXG4gKiAgICAgIC8vIHVzZSBhIGdlbmVyaWMgdG8gc3VwcG9ydCBwcm9wZXIgaW5zdGFuY2UgdHlwaW5nIGluIHRoZSBwcm9wZXJ0eSByZWZsZWN0b3JcbiAqICAgICAgQHByb3BlcnR5PE15RWxlbWVudD4oe1xuICogICAgICAgICAgcmVmbGVjdFByb3BlcnR5OiAocHJvcGVydHlLZXk6IHN0cmluZywgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkge1xuICogICAgICAgICAgICAgIC8vIHRoZSBnZW5lcmljIHR5cGUgYWxsb3dzIGZvciBjb3JyZWN0IHR5cGluZyBvZiB0aGlzXG4gKiAgICAgICAgICAgICAgaWYgKHRoaXMubXlIaWRkZW5Qcm9wZXJ0eSAmJiBuZXdWYWx1ZSkge1xuICogICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnbXktcHJvcGVydHknLCAnJyk7XG4gKiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAqICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ215LXByb3BlcnR5Jyk7XG4gKiAgICAgICAgICAgICAgfVxuICogICAgICAgICAgfVxuICogICAgICB9KVxuICogICAgICBteVByb3BlcnR5ID0gZmFsc2U7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBBIHByb3BlcnR5IGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBwcm9wZXJ0eSA9IDxUeXBlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCA9IEN1c3RvbUVsZW1lbnQ+IChvcHRpb25zOiBQYXJ0aWFsPFByb3BlcnR5RGVjbGFyYXRpb248VHlwZT4+ID0ge30pID0+IHtcblxuICAgIHJldHVybiAodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSk6IHZvaWQgPT4ge1xuXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBnZXRQcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIGNvbnN0IGhpZGRlbktleSA9ICh0eXBlb2YgcHJvcGVydHlLZXkgPT09ICdzdHJpbmcnKSA/IGBfJHsgcHJvcGVydHlLZXkgfWAgOiBTeW1ib2woKTtcbiAgICAgICAgY29uc3QgZ2V0ID0gZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLmdldCB8fCBmdW5jdGlvbiAodGhpczogYW55KSB7IHJldHVybiB0aGlzW2hpZGRlbktleV07IH07XG4gICAgICAgIGNvbnN0IHNldCA9IGRlc2NyaXB0b3IgJiYgZGVzY3JpcHRvci5zZXQgfHwgZnVuY3Rpb24gKHRoaXM6IGFueSwgdmFsdWU6IGFueSkgeyB0aGlzW2hpZGRlbktleV0gPSB2YWx1ZTsgfTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGdldCAoKTogYW55IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0ICh2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzW3Byb3BlcnR5S2V5XTtcbiAgICAgICAgICAgICAgICBzZXQuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0VXBkYXRlKHByb3BlcnR5S2V5LCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRhcmdldC5jb25zdHJ1Y3RvciBhcyBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbjogUHJvcGVydHlEZWNsYXJhdGlvbjxUeXBlPiA9IHsgLi4uREVGQVVMVF9QUk9QRVJUWV9ERUNMQVJBVElPTiwgLi4ub3B0aW9ucyB9O1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi5hdHRyaWJ1dGUgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgZGVjbGFyYXRpb24uYXR0cmlidXRlID0gY3JlYXRlQXR0cmlidXRlTmFtZShwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgdGhlIGRlZmF1bHQgcHJvcGVydHkgY2hhbmdlIGRldGVjdG9yXG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi5vYnNlcnZlID09PSB0cnVlKSB7XG5cbiAgICAgICAgICAgIGRlY2xhcmF0aW9uLm9ic2VydmUgPSBERUZBVUxUX1BST1BFUlRZX0RFQ0xBUkFUSU9OLm9ic2VydmU7XG4gICAgICAgIH1cblxuICAgICAgICBwcmVwYXJlQ29uc3RydWN0b3IoY29uc3RydWN0b3IpO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHdlIGluaGVyaXRlZCBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUgZm9yIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBiYXNlIGNsYXNzXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGNvbnN0cnVjdG9yLnByb3BlcnRpZXMuaGFzKHByb3BlcnR5S2V5KSA/IGNvbnN0cnVjdG9yLnByb3BlcnRpZXMuZ2V0KHByb3BlcnR5S2V5KSEuYXR0cmlidXRlIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIGlmIGF0dHJpYnV0ZSBpcyB0cnV0aHkgaXQncyBhIHN0cmluZyBhbmQgaXQgd2lsbCBleGlzdCBpbiB0aGUgYXR0cmlidXRlcyBtYXBcbiAgICAgICAgaWYgKGF0dHJpYnV0ZSkge1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIGluaGVyaXRlZCBhdHRyaWJ1dGUgYXMgaXQncyBvdmVycmlkZGVuXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzLmRlbGV0ZShhdHRyaWJ1dGUgYXMgc3RyaW5nKTtcblxuICAgICAgICAgICAgLy8gbWFyayBhdHRyaWJ1dGUgYXMgb3ZlcnJpZGRlbiBmb3Ige0BsaW5rIGN1c3RvbUVsZW1lbnR9IGRlY29yYXRvclxuICAgICAgICAgICAgY29uc3RydWN0b3Iub3ZlcnJpZGRlbiEuYWRkKGF0dHJpYnV0ZSBhcyBzdHJpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlY2xhcmF0aW9uLmF0dHJpYnV0ZSkge1xuXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzLnNldChkZWNsYXJhdGlvbi5hdHRyaWJ1dGUsIHByb3BlcnR5S2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN0b3JlIHRoZSBwcm9wZXJ0eSBkZWNsYXJhdGlvbiBsYXN0LCBzbyB3ZSBjYW4gc3RpbGwgYWNjZXNzIHRoZSBpbmhlcml0ZWQgZGVjbGFyYXRpb25cbiAgICAgICAgLy8gd2hlbiBwcm9jZXNzaW5nIHRoZSBhdHRyaWJ1dGVzXG4gICAgICAgIGNvbnN0cnVjdG9yLnByb3BlcnRpZXMuc2V0KHByb3BlcnR5S2V5LCBkZWNsYXJhdGlvbiBhcyBQcm9wZXJ0eURlY2xhcmF0aW9uKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBQcmVwYXJlcyB0aGUgY3VzdG9tIGVsZW1lbnQgY29uc3RydWN0b3IgYnkgaW5pdGlhbGl6aW5nIHN0YXRpYyBwcm9wZXJ0aWVzIGZvciB0aGUgcHJvcGVydHkgZGVjb3JhdG9yLFxuICogc28gd2UgZG9uJ3QgbW9kaWZ5IGEgYmFzZSBjbGFzcydzIHN0YXRpYyBwcm9wZXJ0aWVzLlxuICpcbiAqIEByZW1hcmtzXG4gKiBXaGVuIHRoZSBwcm9wZXJ0eSBkZWNvcmF0b3Igc3RvcmVzIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhbmQgYXR0cmlidXRlIG1hcHBpbmdzIGluIHRoZSBjb25zdHJ1Y3RvcixcbiAqIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRob3NlIHN0YXRpYyBmaWVsZHMgYXJlIGluaXRpYWxpemVkIG9uIHRoZSBjdXJyZW50IGNvbnN0cnVjdG9yLiBPdGhlcndpc2Ugd2VcbiAqIGFkZCBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYW5kIGF0dHJpYnV0ZSBtYXBwaW5ncyB0byB0aGUgYmFzZSBjbGFzcydzIHN0YXRpYyBmaWVsZHMuIFdlIGFsc28gbWFrZVxuICogc3VyZSB0byBpbml0aWFsaXplIHRoZSBjb25zdHJ1Y3RvcnMgbWFwcyB3aXRoIHRoZSB2YWx1ZXMgb2YgdGhlIGJhc2UgY2xhc3MncyBtYXBzIHRvIHByb3Blcmx5XG4gKiBpbmhlcml0IGFsbCBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYW5kIGF0dHJpYnV0ZXMuXG4gKlxuICogQHBhcmFtIGNvbnN0cnVjdG9yIFRoZSBjdXN0b20gZWxlbWVudCBjb25zdHJ1Y3RvciB0byBwcmVwYXJlXG4gKlxuICogQGludGVybmFsXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBwcmVwYXJlQ29uc3RydWN0b3IgKGNvbnN0cnVjdG9yOiBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZSkge1xuXG4gICAgLy8gdGhpcyB3aWxsIGdpdmUgdXMgYSBjb21waWxlLXRpbWUgZXJyb3IgaWYgd2UgcmVmYWN0b3Igb25lIG9mIHRoZSBzdGF0aWMgY29uc3RydWN0b3IgcHJvcGVydGllc1xuICAgIC8vIGFuZCB3ZSB3b24ndCBtaXNzIHJlbmFtaW5nIHRoZSBwcm9wZXJ0eSBrZXlzXG4gICAgY29uc3QgcHJvcGVydGllczoga2V5b2YgRGVjb3JhdGVkQ3VzdG9tRWxlbWVudFR5cGUgPSAncHJvcGVydGllcyc7XG4gICAgY29uc3QgYXR0cmlidXRlczoga2V5b2YgRGVjb3JhdGVkQ3VzdG9tRWxlbWVudFR5cGUgPSAnYXR0cmlidXRlcyc7XG4gICAgY29uc3Qgb3ZlcnJpZGRlbjoga2V5b2YgRGVjb3JhdGVkQ3VzdG9tRWxlbWVudFR5cGUgPSAnb3ZlcnJpZGRlbic7XG5cbiAgICBpZiAoIWNvbnN0cnVjdG9yLmhhc093blByb3BlcnR5KHByb3BlcnRpZXMpKSBjb25zdHJ1Y3Rvci5wcm9wZXJ0aWVzID0gbmV3IE1hcChjb25zdHJ1Y3Rvci5wcm9wZXJ0aWVzKTtcbiAgICBpZiAoIWNvbnN0cnVjdG9yLmhhc093blByb3BlcnR5KGF0dHJpYnV0ZXMpKSBjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzID0gbmV3IE1hcChjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzKTtcbiAgICBpZiAoIWNvbnN0cnVjdG9yLmhhc093blByb3BlcnR5KG92ZXJyaWRkZW4pKSBjb25zdHJ1Y3Rvci5vdmVycmlkZGVuID0gbmV3IFNldCgpO1xufVxuIiwiaW1wb3J0IHsgaHRtbCwgVGVtcGxhdGVSZXN1bHQgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgeyBBdHRyaWJ1dGVDb252ZXJ0ZXJCb29sZWFuLCBjdXN0b21FbGVtZW50LCBDdXN0b21FbGVtZW50LCBsaXN0ZW5lciwgcHJvcGVydHkgfSBmcm9tICcuLi8uLi9zcmMnO1xuXG5AY3VzdG9tRWxlbWVudCh7XG4gICAgc2VsZWN0b3I6ICdjaGVjay1ib3gnXG59KVxuZXhwb3J0IGNsYXNzIENoZWNrYm94IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cbiAgICBAcHJvcGVydHkoKVxuICAgIGN1c3RvbVJvbGUgPSAnY2hlY2tib3gnO1xuXG4gICAgQHByb3BlcnR5PENoZWNrYm94Pih7XG4gICAgICAgIGNvbnZlcnRlcjogQXR0cmlidXRlQ29udmVydGVyQm9vbGVhbixcbiAgICAgICAgcmVmbGVjdFByb3BlcnR5OiAncmVmbGVjdENoZWNrZWQnLFxuICAgICAgICAvLyByZWZsZWN0UHJvcGVydHk6IGZ1bmN0aW9uIChwcm9wZXJ0eUtleTogc3RyaW5nLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG4gICAgICAgIC8vICAgICBpZiAodGhpcy5jdXN0b21DaGVja2VkKSB7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJywgJ3RydWUnKTtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnYXJpYS1jaGVja2VkJywgJ3RydWUnKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJyk7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtY2hlY2tlZCcpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9LFxuICAgICAgICAvLyBub3RpZnk6IHRydWUsXG4gICAgICAgIG5vdGlmeTogJ25vdGlmeUNoZWNrZWQnLFxuICAgICAgICAvLyBub3RpZnk6IGZ1bmN0aW9uIChwcm9wZXJ0eUtleTogc3RyaW5nLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZygnY3VzdG9tIG5vdGlmaWVyLi4uJyk7XG4gICAgICAgIC8vIH1cbiAgICB9KVxuICAgIGN1c3RvbUNoZWNrZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcblxuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIEBsaXN0ZW5lcih7XG4gICAgICAgIGV2ZW50OiAnY2xpY2snXG4gICAgfSlcbiAgICBvbkNsaWNrIChldmVudDogTW91c2VFdmVudCkge1xuXG4gICAgICAgIHRoaXMud2F0Y2goKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLmN1c3RvbUNoZWNrZWQgPSAhdGhpcy5jdXN0b21DaGVja2VkO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGlzLmN1c3RvbUNoZWNrZWQgPSAhdGhpcy5jdXN0b21DaGVja2VkO1xuXG4gICAgICAgIC8vIHRoaXMubm90aWZ5KCdjdXN0b21DaGVja2VkJyk7XG4gICAgfVxuXG4gICAgcmVmbGVjdENoZWNrZWQgKCkge1xuXG4gICAgICAgIGlmICh0aGlzLmN1c3RvbUNoZWNrZWQpIHtcblxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJywgJycpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2FyaWEtY2hlY2tlZCcsICd0cnVlJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJyk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1jaGVja2VkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm90aWZ5Q2hlY2tlZCAoKSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coYG5vdGlmeUNoZWNrZWQuLi5gKTtcbiAgICB9XG5cbiAgICB0ZW1wbGF0ZSAoKTogVGVtcGxhdGVSZXN1bHQge1xuXG4gICAgICAgIHJldHVybiBodG1sYFxuICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMXJlbTtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxcmVtO1xuICAgICAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjOTk5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6aG9zdChbY3VzdG9tLWNoZWNrZWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNjY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC9zdHlsZT5gO1xuICAgIH1cbn1cbiIsImltcG9ydCAnLi9zcmMvY2hlY2tib3gnO1xuXG5mdW5jdGlvbiBib290c3RyYXAgKCkge1xuXG4gICAgY29uc3QgY2hlY2tib3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjaGVjay1ib3gnKTtcblxuICAgIGlmIChjaGVja2JveCkge1xuXG4gICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoZWNrZWQtY2hhbmdlZCcsIGV2ZW50ID0+IGNvbnNvbGUubG9nKChldmVudCBhcyBDdXN0b21FdmVudCkuZGV0YWlsKSk7XG4gICAgfVxufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGJvb3RzdHJhcCk7XG4iXSwibmFtZXMiOlsiZGlyZWN0aXZlIiwicHJlcGFyZUNvbnN0cnVjdG9yIiwidHNsaWJfMS5fX2RlY29yYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsTUFBTSxVQUFVLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNqQyxJQTBCTyxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSztJQUNsQyxJQUFJLE9BQU8sT0FBTyxDQUFDLEtBQUssVUFBVSxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDOztJQzFDRjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtBQUNBLElBQU8sTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLGNBQWMsS0FBSyxTQUFTO0lBQy9ELElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUI7SUFDbkQsUUFBUSxTQUFTLENBQUM7QUFDbEIsSUFjQTtJQUNBO0lBQ0E7SUFDQTtBQUNBLElBQU8sTUFBTSxXQUFXLEdBQUcsQ0FBQyxTQUFTLEVBQUUsU0FB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
