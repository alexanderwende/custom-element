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
    //# sourceMappingURL=directive.js.map

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
    //# sourceMappingURL=dom.js.map

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
    //# sourceMappingURL=part.js.map

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
    //# sourceMappingURL=template.js.map

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
    //# sourceMappingURL=template-instance.js.map

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
    //# sourceMappingURL=template-result.js.map

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
    //# sourceMappingURL=parts.js.map

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
    //# sourceMappingURL=default-template-processor.js.map

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
    //# sourceMappingURL=template-factory.js.map

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
    //# sourceMappingURL=render.js.map

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
    //# sourceMappingURL=lit-html.js.map

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
    //# sourceMappingURL=string-utils.js.map

    /**
     * A map of reusable {@link AttributeConverter}s
     *
     * @remark
     * For the most common types, a converter exists which can be referenced in the {@link PropertyDeclaration}.
     *
     * ```typescript
     * import { CustomElement, property, ATTRIBUTE_CONVERTERS } from 'custom-element';
     *
     * export class MyElement extends CustomElement {
     *
     *      @property({
     *          converter: ATTRIBUTE_CONVERTERS.boolean
     *      })
     *      myProperty = true;
     * }
     * ```
     *
     * TODO: Write tests for this
     */
    const ATTRIBUTE_CONVERTERS = {
        default: {
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
        },
        boolean: {
            fromAttribute: (value) => (value !== null),
            toAttribute: (value) => value ? '' : null
        },
        string: {
            fromAttribute: (value) => (value === null) ? null : value,
            // pass through null or undefined
            toAttribute: (value) => value
        },
        number: {
            fromAttribute: (value) => (value === null) ? null : Number(value),
            // pass through null or undefined using `value == null`
            toAttribute: (value) => (value == null) ? value : value.toString()
        },
        object: {
            // `JSON.parse()` will throw an error for empty strings - we consider it null
            fromAttribute: (value) => (value === null || value === '') ? null : JSON.parse(value),
            // pass through null or undefined using `value == null`
            toAttribute: (value) => (value == null) ? value : JSON.stringify(value)
        },
        array: {
            // `JSON.parse()` will throw an error for empty strings - we consider it null
            fromAttribute: (value) => (value === null || value === '') ? null : JSON.parse(value),
            // pass through null or undefined using `value == null`
            toAttribute: (value) => (value == null) ? value : JSON.stringify(value)
        },
        date: {
            // `new Date()` will return an `Invalid Date` for empty strings - we consider it null
            fromAttribute: (value) => (value === null || value === '') ? null : new Date(value),
            // pass through null or undefined using `value == null`
            toAttribute: (value) => (value == null) ? value : value.toString()
        }
    };
    //# sourceMappingURL=attribute-converter.js.map

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
        converter: ATTRIBUTE_CONVERTERS.default,
        reflectAttribute: true,
        reflectProperty: true,
        notify: true,
        observe: DEFAULT_PROPERTY_CHANGE_DETECTOR,
    };
    //# sourceMappingURL=property-declaration.js.map

    const ATTRIBUTE_REFLECTOR_ERROR = (attributeReflector) => new Error(`Error executing attribute reflector ${String(attributeReflector)}.`);
    const PROPERTY_REFLECTOR_ERROR = (propertyReflector) => new Error(`Error executing property reflector ${String(propertyReflector)}.`);
    const PROPERTY_NOTIFIER_ERROR = (propertyNotifier) => new Error(`Error executing property notifier ${String(propertyNotifier)}.`);
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
            this._hasRequestedUpdate = false;
            this._isReflecting = false;
            this._renderRoot = this.createRenderRoot();
            this._notifyLifecycle('constructed');
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
         * are processed correctly and lifecycle-events are dispatched.
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
            this._notifyLifecycle('attributeChanged');
        }
        /**
         * Invoked each time the custom element renders
         */
        renderCallback() {
            this._notifyLifecycle('render');
        }
        /**
         * Invoked each time the custom element updates
         *
         * @param changedProperties A map of properties that changed in the update, containg the property key and the old value
         */
        updateCallback(changedProperties) {
            this._notifyLifecycle('update');
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
            this.renderCallback();
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
                if (!previousChanges.has(propertyKey) || previousChanges.get(propertyKey) !== oldValue) {
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
            // console.log('requestUpdate()... ', this.constructor.name);
            if (propertyKey) {
                const propertyDeclaration = this._getPropertyDeclaration(propertyKey);
                if (propertyDeclaration) {
                    const { observe } = propertyDeclaration;
                    // check if property is observed
                    if (!observe)
                        return this._updateRequest;
                    // console.log(`requestUpdate()... ${ String(propertyKey) } observe: ${ !!observe }`);
                    // check if property has changed
                    if (typeof observe === 'function' && !observe(oldValue, newValue))
                        return this._updateRequest;
                    // console.log(`requestUpdate()... ${ String(propertyKey) } changed`);
                    // store changed property for batch processing
                    this._changedProperties.set(propertyKey, oldValue);
                    // if we are in reflecting state, an attribute is reflecting to this property and we
                    // can skip reflecting the property back to the attribute
                    // property changes need to be tracked however and {@link render} must be called after
                    // the attribute change is reflected to this property
                    if (!this._isReflecting)
                        this._reflectingProperties.set(propertyKey, oldValue);
                }
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
            this.updateCallback(this._changedProperties);
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
            // TODO: test what happens if attribute is set to false but reflectAttribute is true!
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
         */
        _notifyLifecycle(lifecycle) {
            const eventName = createEventName(lifecycle, 'on');
            this.dispatchEvent(new CustomEvent(eventName, {
                composed: true
            }));
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
                    .reduce((attributes, attribute) => attributes.concat(constructor.overridden.has(attribute) ? [] : attribute), [])
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
    //# sourceMappingURL=custom-element.js.map

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
    //# sourceMappingURL=listener.js.map

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
    //# sourceMappingURL=get-property-descriptor.js.map

    /**
     * Decorates a {@link CustomElement} property
     *
     * @remarks
     * Many of the {@link PropertyDeclaration} options support custom functions, which will be invoked
     * with the custom element instance as `this`-context during execution. In order to support correct
     * typing in these functions, the `@property` decorator supports generic types. Here is an example
     * of how you can use this with a custom {@link PropertReflector}:
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
                    // TODO: maybe invoke propertyChangedCallback instead?
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
    //# sourceMappingURL=property.js.map

    //# sourceMappingURL=index.js.map

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
            converter: ATTRIBUTE_CONVERTERS.boolean,
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
    //# sourceMappingURL=checkbox.js.map

    function bootstrap() {
        const checkbox = document.querySelector('check-box');
        if (checkbox) {
            checkbox.addEventListener('checked-changed', event => console.log(event.detail));
        }
    }
    window.addEventListener('load', bootstrap);
    //# sourceMappingURL=main.js.map

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5idW5kbGUuanMiLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saWIvZGlyZWN0aXZlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2xpYi9kb20uanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3BhcnQuanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3RlbXBsYXRlLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2xpYi90ZW1wbGF0ZS1pbnN0YW5jZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saWIvdGVtcGxhdGUtcmVzdWx0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2xpYi9wYXJ0cy5qcyIsIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saWIvZGVmYXVsdC10ZW1wbGF0ZS1wcm9jZXNzb3IuanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3RlbXBsYXRlLWZhY3RvcnkuanMiLCIuLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGliL3JlbmRlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9saXQtaHRtbC5qcyIsIi4uL3NyYy91dGlscy9zdHJpbmctdXRpbHMudHMiLCIuLi9zcmMvZGVjb3JhdG9ycy9hdHRyaWJ1dGUtY29udmVydGVyLnRzIiwiLi4vc3JjL2RlY29yYXRvcnMvcHJvcGVydHktZGVjbGFyYXRpb24udHMiLCIuLi9zcmMvY3VzdG9tLWVsZW1lbnQudHMiLCIuLi9zcmMvZGVjb3JhdG9ycy9jdXN0b20tZWxlbWVudC50cyIsIi4uL3NyYy9kZWNvcmF0b3JzL2xpc3RlbmVyLnRzIiwiLi4vc3JjL2RlY29yYXRvcnMvZ2V0LXByb3BlcnR5LWRlc2NyaXB0b3IudHMiLCIuLi9zcmMvZGVjb3JhdG9ycy9wcm9wZXJ0eS50cyIsInNyYy9jaGVja2JveC50cyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuY29uc3QgZGlyZWN0aXZlcyA9IG5ldyBXZWFrTWFwKCk7XG4vKipcbiAqIEJyYW5kcyBhIGZ1bmN0aW9uIGFzIGEgZGlyZWN0aXZlIHNvIHRoYXQgbGl0LWh0bWwgd2lsbCBjYWxsIHRoZSBmdW5jdGlvblxuICogZHVyaW5nIHRlbXBsYXRlIHJlbmRlcmluZywgcmF0aGVyIHRoYW4gcGFzc2luZyBhcyBhIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBmIFRoZSBkaXJlY3RpdmUgZmFjdG9yeSBmdW5jdGlvbi4gTXVzdCBiZSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhXG4gKiBmdW5jdGlvbiBvZiB0aGUgc2lnbmF0dXJlIGAocGFydDogUGFydCkgPT4gdm9pZGAuIFRoZSByZXR1cm5lZCBmdW5jdGlvbiB3aWxsXG4gKiBiZSBjYWxsZWQgd2l0aCB0aGUgcGFydCBvYmplY3RcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGBgYFxuICogaW1wb3J0IHtkaXJlY3RpdmUsIGh0bWx9IGZyb20gJ2xpdC1odG1sJztcbiAqXG4gKiBjb25zdCBpbW11dGFibGUgPSBkaXJlY3RpdmUoKHYpID0+IChwYXJ0KSA9PiB7XG4gKiAgIGlmIChwYXJ0LnZhbHVlICE9PSB2KSB7XG4gKiAgICAgcGFydC5zZXRWYWx1ZSh2KVxuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICovXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG5leHBvcnQgY29uc3QgZGlyZWN0aXZlID0gKGYpID0+ICgoLi4uYXJncykgPT4ge1xuICAgIGNvbnN0IGQgPSBmKC4uLmFyZ3MpO1xuICAgIGRpcmVjdGl2ZXMuc2V0KGQsIHRydWUpO1xuICAgIHJldHVybiBkO1xufSk7XG5leHBvcnQgY29uc3QgaXNEaXJlY3RpdmUgPSAobykgPT4ge1xuICAgIHJldHVybiB0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJyAmJiBkaXJlY3RpdmVzLmhhcyhvKTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kaXJlY3RpdmUuanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLyoqXG4gKiBUcnVlIGlmIHRoZSBjdXN0b20gZWxlbWVudHMgcG9seWZpbGwgaXMgaW4gdXNlLlxuICovXG5leHBvcnQgY29uc3QgaXNDRVBvbHlmaWxsID0gd2luZG93LmN1c3RvbUVsZW1lbnRzICE9PSB1bmRlZmluZWQgJiZcbiAgICB3aW5kb3cuY3VzdG9tRWxlbWVudHMucG9seWZpbGxXcmFwRmx1c2hDYWxsYmFjayAhPT1cbiAgICAgICAgdW5kZWZpbmVkO1xuLyoqXG4gKiBSZXBhcmVudHMgbm9kZXMsIHN0YXJ0aW5nIGZyb20gYHN0YXJ0Tm9kZWAgKGluY2x1c2l2ZSkgdG8gYGVuZE5vZGVgXG4gKiAoZXhjbHVzaXZlKSwgaW50byBhbm90aGVyIGNvbnRhaW5lciAoY291bGQgYmUgdGhlIHNhbWUgY29udGFpbmVyKSwgYmVmb3JlXG4gKiBgYmVmb3JlTm9kZWAuIElmIGBiZWZvcmVOb2RlYCBpcyBudWxsLCBpdCBhcHBlbmRzIHRoZSBub2RlcyB0byB0aGVcbiAqIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGNvbnN0IHJlcGFyZW50Tm9kZXMgPSAoY29udGFpbmVyLCBzdGFydCwgZW5kID0gbnVsbCwgYmVmb3JlID0gbnVsbCkgPT4ge1xuICAgIGxldCBub2RlID0gc3RhcnQ7XG4gICAgd2hpbGUgKG5vZGUgIT09IGVuZCkge1xuICAgICAgICBjb25zdCBuID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgY29udGFpbmVyLmluc2VydEJlZm9yZShub2RlLCBiZWZvcmUpO1xuICAgICAgICBub2RlID0gbjtcbiAgICB9XG59O1xuLyoqXG4gKiBSZW1vdmVzIG5vZGVzLCBzdGFydGluZyBmcm9tIGBzdGFydE5vZGVgIChpbmNsdXNpdmUpIHRvIGBlbmROb2RlYFxuICogKGV4Y2x1c2l2ZSksIGZyb20gYGNvbnRhaW5lcmAuXG4gKi9cbmV4cG9ydCBjb25zdCByZW1vdmVOb2RlcyA9IChjb250YWluZXIsIHN0YXJ0Tm9kZSwgZW5kTm9kZSA9IG51bGwpID0+IHtcbiAgICBsZXQgbm9kZSA9IHN0YXJ0Tm9kZTtcbiAgICB3aGlsZSAobm9kZSAhPT0gZW5kTm9kZSkge1xuICAgICAgICBjb25zdCBuID0gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgY29udGFpbmVyLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICBub2RlID0gbjtcbiAgICB9XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZG9tLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxOCBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8qKlxuICogQSBzZW50aW5lbCB2YWx1ZSB0aGF0IHNpZ25hbHMgdGhhdCBhIHZhbHVlIHdhcyBoYW5kbGVkIGJ5IGEgZGlyZWN0aXZlIGFuZFxuICogc2hvdWxkIG5vdCBiZSB3cml0dGVuIHRvIHRoZSBET00uXG4gKi9cbmV4cG9ydCBjb25zdCBub0NoYW5nZSA9IHt9O1xuLyoqXG4gKiBBIHNlbnRpbmVsIHZhbHVlIHRoYXQgc2lnbmFscyBhIE5vZGVQYXJ0IHRvIGZ1bGx5IGNsZWFyIGl0cyBjb250ZW50LlxuICovXG5leHBvcnQgY29uc3Qgbm90aGluZyA9IHt9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGFydC5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vKipcbiAqIEFuIGV4cHJlc3Npb24gbWFya2VyIHdpdGggZW1iZWRkZWQgdW5pcXVlIGtleSB0byBhdm9pZCBjb2xsaXNpb24gd2l0aFxuICogcG9zc2libGUgdGV4dCBpbiB0ZW1wbGF0ZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBtYXJrZXIgPSBge3tsaXQtJHtTdHJpbmcoTWF0aC5yYW5kb20oKSkuc2xpY2UoMil9fX1gO1xuLyoqXG4gKiBBbiBleHByZXNzaW9uIG1hcmtlciB1c2VkIHRleHQtcG9zaXRpb25zLCBtdWx0aS1iaW5kaW5nIGF0dHJpYnV0ZXMsIGFuZFxuICogYXR0cmlidXRlcyB3aXRoIG1hcmt1cC1saWtlIHRleHQgdmFsdWVzLlxuICovXG5leHBvcnQgY29uc3Qgbm9kZU1hcmtlciA9IGA8IS0tJHttYXJrZXJ9LS0+YDtcbmV4cG9ydCBjb25zdCBtYXJrZXJSZWdleCA9IG5ldyBSZWdFeHAoYCR7bWFya2VyfXwke25vZGVNYXJrZXJ9YCk7XG4vKipcbiAqIFN1ZmZpeCBhcHBlbmRlZCB0byBhbGwgYm91bmQgYXR0cmlidXRlIG5hbWVzLlxuICovXG5leHBvcnQgY29uc3QgYm91bmRBdHRyaWJ1dGVTdWZmaXggPSAnJGxpdCQnO1xuLyoqXG4gKiBBbiB1cGRhdGVhYmxlIFRlbXBsYXRlIHRoYXQgdHJhY2tzIHRoZSBsb2NhdGlvbiBvZiBkeW5hbWljIHBhcnRzLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGUge1xuICAgIGNvbnN0cnVjdG9yKHJlc3VsdCwgZWxlbWVudCkge1xuICAgICAgICB0aGlzLnBhcnRzID0gW107XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgICBsZXQgcGFydEluZGV4ID0gMDtcbiAgICAgICAgY29uc3Qgbm9kZXNUb1JlbW92ZSA9IFtdO1xuICAgICAgICBjb25zdCBfcHJlcGFyZVRlbXBsYXRlID0gKHRlbXBsYXRlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcbiAgICAgICAgICAgIC8vIEVkZ2UgbmVlZHMgYWxsIDQgcGFyYW1ldGVycyBwcmVzZW50OyBJRTExIG5lZWRzIDNyZCBwYXJhbWV0ZXIgdG8gYmVcbiAgICAgICAgICAgIC8vIG51bGxcbiAgICAgICAgICAgIGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIoY29udGVudCwgMTMzIC8qIE5vZGVGaWx0ZXIuU0hPV197RUxFTUVOVHxDT01NRU5UfFRFWFR9ICovLCBudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgbGFzdCBpbmRleCBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0LiBXZSB0cnkgdG8gZGVsZXRlXG4gICAgICAgICAgICAvLyB1bm5lY2Vzc2FyeSBub2RlcywgYnV0IHdlIG5ldmVyIHdhbnQgdG8gYXNzb2NpYXRlIHR3byBkaWZmZXJlbnQgcGFydHNcbiAgICAgICAgICAgIC8vIHRvIHRoZSBzYW1lIGluZGV4LiBUaGV5IG11c3QgaGF2ZSBhIGNvbnN0YW50IG5vZGUgYmV0d2Vlbi5cbiAgICAgICAgICAgIGxldCBsYXN0UGFydEluZGV4ID0gMDtcbiAgICAgICAgICAgIHdoaWxlICh3YWxrZXIubmV4dE5vZGUoKSkge1xuICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHdhbGtlci5jdXJyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAvKiBOb2RlLkVMRU1FTlRfTk9ERSAqLykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5oYXNBdHRyaWJ1dGVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9OYW1lZE5vZGVNYXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhdHRyaWJ1dGVzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSByZXR1cm5lZCBpbiBkb2N1bWVudCBvcmRlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluIHBhcnRpY3VsYXIsIEVkZ2UvSUUgY2FuIHJldHVybiB0aGVtIG91dCBvZiBvcmRlciwgc28gd2UgY2Fubm90XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhc3N1bWUgYSBjb3JyZXNwb25kYW5jZSBiZXR3ZWVuIHBhcnQgaW5kZXggYW5kIGF0dHJpYnV0ZSBpbmRleC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlc1tpXS52YWx1ZS5pbmRleE9mKG1hcmtlcikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChjb3VudC0tID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgdGVtcGxhdGUgbGl0ZXJhbCBzZWN0aW9uIGxlYWRpbmcgdXAgdG8gdGhlIGZpcnN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhwcmVzc2lvbiBpbiB0aGlzIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0cmluZ0ZvclBhcnQgPSByZXN1bHQuc3RyaW5nc1twYXJ0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGxhc3RBdHRyaWJ1dGVOYW1lUmVnZXguZXhlYyhzdHJpbmdGb3JQYXJ0KVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSBjb3JyZXNwb25kaW5nIGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBib3VuZCBhdHRyaWJ1dGVzIGhhdmUgaGFkIGEgc3VmZml4IGFkZGVkIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGVtcGxhdGVSZXN1bHQjZ2V0SFRNTCB0byBvcHQgb3V0IG9mIHNwZWNpYWwgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGFuZGxpbmcuIFRvIGxvb2sgdXAgdGhlIGF0dHJpYnV0ZSB2YWx1ZSB3ZSBhbHNvIG5lZWQgdG8gYWRkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHN1ZmZpeC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhdHRyaWJ1dGVMb29rdXBOYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpICsgYm91bmRBdHRyaWJ1dGVTdWZmaXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBub2RlLmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVMb29rdXBOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdHJpbmdzID0gYXR0cmlidXRlVmFsdWUuc3BsaXQobWFya2VyUmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFydHMucHVzaCh7IHR5cGU6ICdhdHRyaWJ1dGUnLCBpbmRleCwgbmFtZSwgc3RyaW5ncyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGVMb29rdXBOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJ0SW5kZXggKz0gc3RyaW5ncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnRhZ05hbWUgPT09ICdURU1QTEFURScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9wcmVwYXJlVGVtcGxhdGUobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMyAvKiBOb2RlLlRFWFRfTk9ERSAqLykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gbm9kZS5kYXRhO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5pbmRleE9mKG1hcmtlcikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RyaW5ncyA9IGRhdGEuc3BsaXQobWFya2VyUmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gc3RyaW5ncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgYSBuZXcgdGV4dCBub2RlIGZvciBlYWNoIGxpdGVyYWwgc2VjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlc2Ugbm9kZXMgYXJlIGFsc28gdXNlZCBhcyB0aGUgbWFya2VycyBmb3Igbm9kZSBwYXJ0c1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYXN0SW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoKHN0cmluZ3NbaV0gPT09ICcnKSA/IGNyZWF0ZU1hcmtlcigpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3RyaW5nc1tpXSksIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFydHMucHVzaCh7IHR5cGU6ICdub2RlJywgaW5kZXg6ICsraW5kZXggfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSdzIG5vIHRleHQsIHdlIG11c3QgaW5zZXJ0IGEgY29tbWVudCB0byBtYXJrIG91ciBwbGFjZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIHdlIGNhbiB0cnVzdCBpdCB3aWxsIHN0aWNrIGFyb3VuZCBhZnRlciBjbG9uaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmluZ3NbbGFzdEluZGV4XSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGNyZWF0ZU1hcmtlcigpLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2Rlc1RvUmVtb3ZlLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmRhdGEgPSBzdHJpbmdzW2xhc3RJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgcGFydCBmb3IgZWFjaCBtYXRjaCBmb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFydEluZGV4ICs9IGxhc3RJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSA4IC8qIE5vZGUuQ09NTUVOVF9OT0RFICovKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmRhdGEgPT09IG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGEgbmV3IG1hcmtlciBub2RlIHRvIGJlIHRoZSBzdGFydE5vZGUgb2YgdGhlIFBhcnQgaWYgYW55IG9mXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZm9sbG93aW5nIGFyZSB0cnVlOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICogV2UgZG9uJ3QgaGF2ZSBhIHByZXZpb3VzU2libGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICogVGhlIHByZXZpb3VzU2libGluZyBpcyBhbHJlYWR5IHRoZSBzdGFydCBvZiBhIHByZXZpb3VzIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnByZXZpb3VzU2libGluZyA9PT0gbnVsbCB8fCBpbmRleCA9PT0gbGFzdFBhcnRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShjcmVhdGVNYXJrZXIoKSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0UGFydEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcnRzLnB1c2goeyB0eXBlOiAnbm9kZScsIGluZGV4IH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIG5leHRTaWJsaW5nLCBrZWVwIHRoaXMgbm9kZSBzbyB3ZSBoYXZlIGFuIGVuZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIHdlIGNhbiByZW1vdmUgaXQgdG8gc2F2ZSBmdXR1cmUgY29zdHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5uZXh0U2libGluZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuZGF0YSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNUb1JlbW92ZS5wdXNoKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LS07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0SW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpID0gLTE7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKGkgPSBub2RlLmRhdGEuaW5kZXhPZihtYXJrZXIsIGkgKyAxKSkgIT09XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21tZW50IG5vZGUgaGFzIGEgYmluZGluZyBtYXJrZXIgaW5zaWRlLCBtYWtlIGFuIGluYWN0aXZlIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgYmluZGluZyB3b24ndCB3b3JrLCBidXQgc3Vic2VxdWVudCBiaW5kaW5ncyB3aWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyAoanVzdGluZmFnbmFuaSk6IGNvbnNpZGVyIHdoZXRoZXIgaXQncyBldmVuIHdvcnRoIGl0IHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBiaW5kaW5ncyBpbiBjb21tZW50cyB3b3JrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJ0cy5wdXNoKHsgdHlwZTogJ25vZGUnLCBpbmRleDogLTEgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIF9wcmVwYXJlVGVtcGxhdGUoZWxlbWVudCk7XG4gICAgICAgIC8vIFJlbW92ZSB0ZXh0IGJpbmRpbmcgbm9kZXMgYWZ0ZXIgdGhlIHdhbGsgdG8gbm90IGRpc3R1cmIgdGhlIFRyZWVXYWxrZXJcbiAgICAgICAgZm9yIChjb25zdCBuIG9mIG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgICAgIG4ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChuKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBpc1RlbXBsYXRlUGFydEFjdGl2ZSA9IChwYXJ0KSA9PiBwYXJ0LmluZGV4ICE9PSAtMTtcbi8vIEFsbG93cyBgZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJylgIHRvIGJlIHJlbmFtZWQgZm9yIGFcbi8vIHNtYWxsIG1hbnVhbCBzaXplLXNhdmluZ3MuXG5leHBvcnQgY29uc3QgY3JlYXRlTWFya2VyID0gKCkgPT4gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJyk7XG4vKipcbiAqIFRoaXMgcmVnZXggZXh0cmFjdHMgdGhlIGF0dHJpYnV0ZSBuYW1lIHByZWNlZGluZyBhbiBhdHRyaWJ1dGUtcG9zaXRpb25cbiAqIGV4cHJlc3Npb24uIEl0IGRvZXMgdGhpcyBieSBtYXRjaGluZyB0aGUgc3ludGF4IGFsbG93ZWQgZm9yIGF0dHJpYnV0ZXNcbiAqIGFnYWluc3QgdGhlIHN0cmluZyBsaXRlcmFsIGRpcmVjdGx5IHByZWNlZGluZyB0aGUgZXhwcmVzc2lvbiwgYXNzdW1pbmcgdGhhdFxuICogdGhlIGV4cHJlc3Npb24gaXMgaW4gYW4gYXR0cmlidXRlLXZhbHVlIHBvc2l0aW9uLlxuICpcbiAqIFNlZSBhdHRyaWJ1dGVzIGluIHRoZSBIVE1MIHNwZWM6XG4gKiBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvc3ludGF4Lmh0bWwjYXR0cmlidXRlcy0wXG4gKlxuICogXCJcXDAtXFx4MUZcXHg3Ri1cXHg5RlwiIGFyZSBVbmljb2RlIGNvbnRyb2wgY2hhcmFjdGVyc1xuICpcbiAqIFwiIFxceDA5XFx4MGFcXHgwY1xceDBkXCIgYXJlIEhUTUwgc3BhY2UgY2hhcmFjdGVyczpcbiAqIGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9pbmZyYXN0cnVjdHVyZS5odG1sI3NwYWNlLWNoYXJhY3RlclxuICpcbiAqIFNvIGFuIGF0dHJpYnV0ZSBpczpcbiAqICAqIFRoZSBuYW1lOiBhbnkgY2hhcmFjdGVyIGV4Y2VwdCBhIGNvbnRyb2wgY2hhcmFjdGVyLCBzcGFjZSBjaGFyYWN0ZXIsICgnKSxcbiAqICAgIChcIiksIFwiPlwiLCBcIj1cIiwgb3IgXCIvXCJcbiAqICAqIEZvbGxvd2VkIGJ5IHplcm8gb3IgbW9yZSBzcGFjZSBjaGFyYWN0ZXJzXG4gKiAgKiBGb2xsb3dlZCBieSBcIj1cIlxuICogICogRm9sbG93ZWQgYnkgemVybyBvciBtb3JlIHNwYWNlIGNoYXJhY3RlcnNcbiAqICAqIEZvbGxvd2VkIGJ5OlxuICogICAgKiBBbnkgY2hhcmFjdGVyIGV4Y2VwdCBzcGFjZSwgKCcpLCAoXCIpLCBcIjxcIiwgXCI+XCIsIFwiPVwiLCAoYCksIG9yXG4gKiAgICAqIChcIikgdGhlbiBhbnkgbm9uLShcIiksIG9yXG4gKiAgICAqICgnKSB0aGVuIGFueSBub24tKCcpXG4gKi9cbmV4cG9ydCBjb25zdCBsYXN0QXR0cmlidXRlTmFtZVJlZ2V4ID0gLyhbIFxceDA5XFx4MGFcXHgwY1xceDBkXSkoW15cXDAtXFx4MUZcXHg3Ri1cXHg5RiBcXHgwOVxceDBhXFx4MGNcXHgwZFwiJz49L10rKShbIFxceDA5XFx4MGFcXHgwY1xceDBkXSo9WyBcXHgwOVxceDBhXFx4MGNcXHgwZF0qKD86W14gXFx4MDlcXHgwYVxceDBjXFx4MGRcIidgPD49XSp8XCJbXlwiXSp8J1teJ10qKSkkLztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNyBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbi8qKlxuICogQG1vZHVsZSBsaXQtaHRtbFxuICovXG5pbXBvcnQgeyBpc0NFUG9seWZpbGwgfSBmcm9tICcuL2RvbS5qcyc7XG5pbXBvcnQgeyBpc1RlbXBsYXRlUGFydEFjdGl2ZSB9IGZyb20gJy4vdGVtcGxhdGUuanMnO1xuLyoqXG4gKiBBbiBpbnN0YW5jZSBvZiBhIGBUZW1wbGF0ZWAgdGhhdCBjYW4gYmUgYXR0YWNoZWQgdG8gdGhlIERPTSBhbmQgdXBkYXRlZFxuICogd2l0aCBuZXcgdmFsdWVzLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVJbnN0YW5jZSB7XG4gICAgY29uc3RydWN0b3IodGVtcGxhdGUsIHByb2Nlc3Nvciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9wYXJ0cyA9IFtdO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIHRoaXMucHJvY2Vzc29yID0gcHJvY2Vzc29yO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH1cbiAgICB1cGRhdGUodmFsdWVzKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHRoaXMuX3BhcnRzKSB7XG4gICAgICAgICAgICBpZiAocGFydCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcGFydC5zZXRWYWx1ZSh2YWx1ZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiB0aGlzLl9wYXJ0cykge1xuICAgICAgICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBhcnQuY29tbWl0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2Nsb25lKCkge1xuICAgICAgICAvLyBXaGVuIHVzaW5nIHRoZSBDdXN0b20gRWxlbWVudHMgcG9seWZpbGwsIGNsb25lIHRoZSBub2RlLCByYXRoZXIgdGhhblxuICAgICAgICAvLyBpbXBvcnRpbmcgaXQsIHRvIGtlZXAgdGhlIGZyYWdtZW50IGluIHRoZSB0ZW1wbGF0ZSdzIGRvY3VtZW50LiBUaGlzXG4gICAgICAgIC8vIGxlYXZlcyB0aGUgZnJhZ21lbnQgaW5lcnQgc28gY3VzdG9tIGVsZW1lbnRzIHdvbid0IHVwZ3JhZGUgYW5kXG4gICAgICAgIC8vIHBvdGVudGlhbGx5IG1vZGlmeSB0aGVpciBjb250ZW50cyBieSBjcmVhdGluZyBhIHBvbHlmaWxsZWQgU2hhZG93Um9vdFxuICAgICAgICAvLyB3aGlsZSB3ZSB0cmF2ZXJzZSB0aGUgdHJlZS5cbiAgICAgICAgY29uc3QgZnJhZ21lbnQgPSBpc0NFUG9seWZpbGwgP1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZS5lbGVtZW50LmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpIDpcbiAgICAgICAgICAgIGRvY3VtZW50LmltcG9ydE5vZGUodGhpcy50ZW1wbGF0ZS5lbGVtZW50LmNvbnRlbnQsIHRydWUpO1xuICAgICAgICBjb25zdCBwYXJ0cyA9IHRoaXMudGVtcGxhdGUucGFydHM7XG4gICAgICAgIGxldCBwYXJ0SW5kZXggPSAwO1xuICAgICAgICBsZXQgbm9kZUluZGV4ID0gMDtcbiAgICAgICAgY29uc3QgX3ByZXBhcmVJbnN0YW5jZSA9IChmcmFnbWVudCkgPT4ge1xuICAgICAgICAgICAgLy8gRWRnZSBuZWVkcyBhbGwgNCBwYXJhbWV0ZXJzIHByZXNlbnQ7IElFMTEgbmVlZHMgM3JkIHBhcmFtZXRlciB0byBiZVxuICAgICAgICAgICAgLy8gbnVsbFxuICAgICAgICAgICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihmcmFnbWVudCwgMTMzIC8qIE5vZGVGaWx0ZXIuU0hPV197RUxFTUVOVHxDT01NRU5UfFRFWFR9ICovLCBudWxsLCBmYWxzZSk7XG4gICAgICAgICAgICBsZXQgbm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCB0aGUgbm9kZXMgYW5kIHBhcnRzIG9mIGEgdGVtcGxhdGVcbiAgICAgICAgICAgIHdoaWxlIChwYXJ0SW5kZXggPCBwYXJ0cy5sZW5ndGggJiYgbm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1twYXJ0SW5kZXhdO1xuICAgICAgICAgICAgICAgIC8vIENvbnNlY3V0aXZlIFBhcnRzIG1heSBoYXZlIHRoZSBzYW1lIG5vZGUgaW5kZXgsIGluIHRoZSBjYXNlIG9mXG4gICAgICAgICAgICAgICAgLy8gbXVsdGlwbGUgYm91bmQgYXR0cmlidXRlcyBvbiBhbiBlbGVtZW50LiBTbyBlYWNoIGl0ZXJhdGlvbiB3ZSBlaXRoZXJcbiAgICAgICAgICAgICAgICAvLyBpbmNyZW1lbnQgdGhlIG5vZGVJbmRleCwgaWYgd2UgYXJlbid0IG9uIGEgbm9kZSB3aXRoIGEgcGFydCwgb3IgdGhlXG4gICAgICAgICAgICAgICAgLy8gcGFydEluZGV4IGlmIHdlIGFyZS4gQnkgbm90IGluY3JlbWVudGluZyB0aGUgbm9kZUluZGV4IHdoZW4gd2UgZmluZCBhXG4gICAgICAgICAgICAgICAgLy8gcGFydCwgd2UgYWxsb3cgZm9yIHRoZSBuZXh0IHBhcnQgdG8gYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50XG4gICAgICAgICAgICAgICAgLy8gbm9kZSBpZiBuZWNjZXNzYXNyeS5cbiAgICAgICAgICAgICAgICBpZiAoIWlzVGVtcGxhdGVQYXJ0QWN0aXZlKHBhcnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcnRzLnB1c2godW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgcGFydEluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vZGVJbmRleCA9PT0gcGFydC5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFydC50eXBlID09PSAnbm9kZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnQgPSB0aGlzLnByb2Nlc3Nvci5oYW5kbGVUZXh0RXhwcmVzc2lvbih0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydC5pbnNlcnRBZnRlck5vZGUobm9kZS5wcmV2aW91c1NpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFydHMucHVzaChwYXJ0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcnRzLnB1c2goLi4udGhpcy5wcm9jZXNzb3IuaGFuZGxlQXR0cmlidXRlRXhwcmVzc2lvbnMobm9kZSwgcGFydC5uYW1lLCBwYXJ0LnN0cmluZ3MsIHRoaXMub3B0aW9ucykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhcnRJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZUluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSAnVEVNUExBVEUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfcHJlcGFyZUluc3RhbmNlKG5vZGUuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgX3ByZXBhcmVJbnN0YW5jZShmcmFnbWVudCk7XG4gICAgICAgIGlmIChpc0NFUG9seWZpbGwpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkb3B0Tm9kZShmcmFnbWVudCk7XG4gICAgICAgICAgICBjdXN0b21FbGVtZW50cy51cGdyYWRlKGZyYWdtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnJhZ21lbnQ7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGVtcGxhdGUtaW5zdGFuY2UuanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLyoqXG4gKiBAbW9kdWxlIGxpdC1odG1sXG4gKi9cbmltcG9ydCB7IHJlcGFyZW50Tm9kZXMgfSBmcm9tICcuL2RvbS5qcyc7XG5pbXBvcnQgeyBib3VuZEF0dHJpYnV0ZVN1ZmZpeCwgbGFzdEF0dHJpYnV0ZU5hbWVSZWdleCwgbWFya2VyLCBub2RlTWFya2VyIH0gZnJvbSAnLi90ZW1wbGF0ZS5qcyc7XG4vKipcbiAqIFRoZSByZXR1cm4gdHlwZSBvZiBgaHRtbGAsIHdoaWNoIGhvbGRzIGEgVGVtcGxhdGUgYW5kIHRoZSB2YWx1ZXMgZnJvbVxuICogaW50ZXJwb2xhdGVkIGV4cHJlc3Npb25zLlxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVSZXN1bHQge1xuICAgIGNvbnN0cnVjdG9yKHN0cmluZ3MsIHZhbHVlcywgdHlwZSwgcHJvY2Vzc29yKSB7XG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XG4gICAgICAgIHRoaXMudmFsdWVzID0gdmFsdWVzO1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLnByb2Nlc3NvciA9IHByb2Nlc3NvcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHN0cmluZyBvZiBIVE1MIHVzZWQgdG8gY3JlYXRlIGEgYDx0ZW1wbGF0ZT5gIGVsZW1lbnQuXG4gICAgICovXG4gICAgZ2V0SFRNTCgpIHtcbiAgICAgICAgY29uc3QgZW5kSW5kZXggPSB0aGlzLnN0cmluZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgbGV0IGh0bWwgPSAnJztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmRJbmRleDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBzID0gdGhpcy5zdHJpbmdzW2ldO1xuICAgICAgICAgICAgLy8gVGhpcyBleGVjKCkgY2FsbCBkb2VzIHR3byB0aGluZ3M6XG4gICAgICAgICAgICAvLyAxKSBBcHBlbmRzIGEgc3VmZml4IHRvIHRoZSBib3VuZCBhdHRyaWJ1dGUgbmFtZSB0byBvcHQgb3V0IG9mIHNwZWNpYWxcbiAgICAgICAgICAgIC8vIGF0dHJpYnV0ZSB2YWx1ZSBwYXJzaW5nIHRoYXQgSUUxMSBhbmQgRWRnZSBkbywgbGlrZSBmb3Igc3R5bGUgYW5kXG4gICAgICAgICAgICAvLyBtYW55IFNWRyBhdHRyaWJ1dGVzLiBUaGUgVGVtcGxhdGUgY2xhc3MgYWxzbyBhcHBlbmRzIHRoZSBzYW1lIHN1ZmZpeFxuICAgICAgICAgICAgLy8gd2hlbiBsb29raW5nIHVwIGF0dHJpYnV0ZXMgdG8gY3JlYXRlIFBhcnRzLlxuICAgICAgICAgICAgLy8gMikgQWRkcyBhbiB1bnF1b3RlZC1hdHRyaWJ1dGUtc2FmZSBtYXJrZXIgZm9yIHRoZSBmaXJzdCBleHByZXNzaW9uIGluXG4gICAgICAgICAgICAvLyBhbiBhdHRyaWJ1dGUuIFN1YnNlcXVlbnQgYXR0cmlidXRlIGV4cHJlc3Npb25zIHdpbGwgdXNlIG5vZGUgbWFya2VycyxcbiAgICAgICAgICAgIC8vIGFuZCB0aGlzIGlzIHNhZmUgc2luY2UgYXR0cmlidXRlcyB3aXRoIG11bHRpcGxlIGV4cHJlc3Npb25zIGFyZVxuICAgICAgICAgICAgLy8gZ3VhcmFudGVlZCB0byBiZSBxdW90ZWQuXG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IGxhc3RBdHRyaWJ1dGVOYW1lUmVnZXguZXhlYyhzKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIC8vIFdlJ3JlIHN0YXJ0aW5nIGEgbmV3IGJvdW5kIGF0dHJpYnV0ZS5cbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIHNhZmUgYXR0cmlidXRlIHN1ZmZpeCwgYW5kIHVzZSB1bnF1b3RlZC1hdHRyaWJ1dGUtc2FmZVxuICAgICAgICAgICAgICAgIC8vIG1hcmtlci5cbiAgICAgICAgICAgICAgICBodG1sICs9IHMuc3Vic3RyKDAsIG1hdGNoLmluZGV4KSArIG1hdGNoWzFdICsgbWF0Y2hbMl0gK1xuICAgICAgICAgICAgICAgICAgICBib3VuZEF0dHJpYnV0ZVN1ZmZpeCArIG1hdGNoWzNdICsgbWFya2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2UncmUgZWl0aGVyIGluIGEgYm91bmQgbm9kZSwgb3IgdHJhaWxpbmcgYm91bmQgYXR0cmlidXRlLlxuICAgICAgICAgICAgICAgIC8vIEVpdGhlciB3YXksIG5vZGVNYXJrZXIgaXMgc2FmZSB0byB1c2UuXG4gICAgICAgICAgICAgICAgaHRtbCArPSBzICsgbm9kZU1hcmtlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaHRtbCArIHRoaXMuc3RyaW5nc1tlbmRJbmRleF07XG4gICAgfVxuICAgIGdldFRlbXBsYXRlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLmdldEhUTUwoKTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cbn1cbi8qKlxuICogQSBUZW1wbGF0ZVJlc3VsdCBmb3IgU1ZHIGZyYWdtZW50cy5cbiAqXG4gKiBUaGlzIGNsYXNzIHdyYXBzIEhUTWwgaW4gYW4gYDxzdmc+YCB0YWcgaW4gb3JkZXIgdG8gcGFyc2UgaXRzIGNvbnRlbnRzIGluIHRoZVxuICogU1ZHIG5hbWVzcGFjZSwgdGhlbiBtb2RpZmllcyB0aGUgdGVtcGxhdGUgdG8gcmVtb3ZlIHRoZSBgPHN2Zz5gIHRhZyBzbyB0aGF0XG4gKiBjbG9uZXMgb25seSBjb250YWluZXIgdGhlIG9yaWdpbmFsIGZyYWdtZW50LlxuICovXG5leHBvcnQgY2xhc3MgU1ZHVGVtcGxhdGVSZXN1bHQgZXh0ZW5kcyBUZW1wbGF0ZVJlc3VsdCB7XG4gICAgZ2V0SFRNTCgpIHtcbiAgICAgICAgcmV0dXJuIGA8c3ZnPiR7c3VwZXIuZ2V0SFRNTCgpfTwvc3ZnPmA7XG4gICAgfVxuICAgIGdldFRlbXBsYXRlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBzdXBlci5nZXRUZW1wbGF0ZUVsZW1lbnQoKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9IHRlbXBsYXRlLmNvbnRlbnQ7XG4gICAgICAgIGNvbnN0IHN2Z0VsZW1lbnQgPSBjb250ZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgIGNvbnRlbnQucmVtb3ZlQ2hpbGQoc3ZnRWxlbWVudCk7XG4gICAgICAgIHJlcGFyZW50Tm9kZXMoY29udGVudCwgc3ZnRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLXJlc3VsdC5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vKipcbiAqIEBtb2R1bGUgbGl0LWh0bWxcbiAqL1xuaW1wb3J0IHsgaXNEaXJlY3RpdmUgfSBmcm9tICcuL2RpcmVjdGl2ZS5qcyc7XG5pbXBvcnQgeyByZW1vdmVOb2RlcyB9IGZyb20gJy4vZG9tLmpzJztcbmltcG9ydCB7IG5vQ2hhbmdlLCBub3RoaW5nIH0gZnJvbSAnLi9wYXJ0LmpzJztcbmltcG9ydCB7IFRlbXBsYXRlSW5zdGFuY2UgfSBmcm9tICcuL3RlbXBsYXRlLWluc3RhbmNlLmpzJztcbmltcG9ydCB7IFRlbXBsYXRlUmVzdWx0IH0gZnJvbSAnLi90ZW1wbGF0ZS1yZXN1bHQuanMnO1xuaW1wb3J0IHsgY3JlYXRlTWFya2VyIH0gZnJvbSAnLi90ZW1wbGF0ZS5qcyc7XG5leHBvcnQgY29uc3QgaXNQcmltaXRpdmUgPSAodmFsdWUpID0+IHtcbiAgICByZXR1cm4gKHZhbHVlID09PSBudWxsIHx8XG4gICAgICAgICEodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpKTtcbn07XG4vKipcbiAqIFNldHMgYXR0cmlidXRlIHZhbHVlcyBmb3IgQXR0cmlidXRlUGFydHMsIHNvIHRoYXQgdGhlIHZhbHVlIGlzIG9ubHkgc2V0IG9uY2VcbiAqIGV2ZW4gaWYgdGhlcmUgYXJlIG11bHRpcGxlIHBhcnRzIGZvciBhbiBhdHRyaWJ1dGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBBdHRyaWJ1dGVDb21taXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MpIHtcbiAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuc3RyaW5ncyA9IHN0cmluZ3M7XG4gICAgICAgIHRoaXMucGFydHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJpbmdzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJ0c1tpXSA9IHRoaXMuX2NyZWF0ZVBhcnQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgc2luZ2xlIHBhcnQuIE92ZXJyaWRlIHRoaXMgdG8gY3JlYXRlIGEgZGlmZmVybnQgdHlwZSBvZiBwYXJ0LlxuICAgICAqL1xuICAgIF9jcmVhdGVQYXJ0KCkge1xuICAgICAgICByZXR1cm4gbmV3IEF0dHJpYnV0ZVBhcnQodGhpcyk7XG4gICAgfVxuICAgIF9nZXRWYWx1ZSgpIHtcbiAgICAgICAgY29uc3Qgc3RyaW5ncyA9IHRoaXMuc3RyaW5ncztcbiAgICAgICAgY29uc3QgbCA9IHN0cmluZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgbGV0IHRleHQgPSAnJztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRleHQgKz0gc3RyaW5nc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHBhcnQgPSB0aGlzLnBhcnRzW2ldO1xuICAgICAgICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBwYXJ0LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh2ICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgKEFycmF5LmlzQXJyYXkodikgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiB2ICE9PSAnc3RyaW5nJyAmJiB2W1N5bWJvbC5pdGVyYXRvcl0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdCBvZiB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ICs9IHR5cGVvZiB0ID09PSAnc3RyaW5nJyA/IHQgOiBTdHJpbmcodCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgKz0gdHlwZW9mIHYgPT09ICdzdHJpbmcnID8gdiA6IFN0cmluZyh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGV4dCArPSBzdHJpbmdzW2xdO1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG4gICAgY29tbWl0KCkge1xuICAgICAgICBpZiAodGhpcy5kaXJ0eSkge1xuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSh0aGlzLm5hbWUsIHRoaXMuX2dldFZhbHVlKCkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZVBhcnQge1xuICAgIGNvbnN0cnVjdG9yKGNvbWl0dGVyKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY29tbWl0dGVyID0gY29taXR0ZXI7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gbm9DaGFuZ2UgJiYgKCFpc1ByaW1pdGl2ZSh2YWx1ZSkgfHwgdmFsdWUgIT09IHRoaXMudmFsdWUpKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYSBub3QgYSBkaXJlY3RpdmUsIGRpcnR5IHRoZSBjb21taXR0ZXIgc28gdGhhdCBpdCdsbFxuICAgICAgICAgICAgLy8gY2FsbCBzZXRBdHRyaWJ1dGUuIElmIHRoZSB2YWx1ZSBpcyBhIGRpcmVjdGl2ZSwgaXQnbGwgZGlydHkgdGhlXG4gICAgICAgICAgICAvLyBjb21taXR0ZXIgaWYgaXQgY2FsbHMgc2V0VmFsdWUoKS5cbiAgICAgICAgICAgIGlmICghaXNEaXJlY3RpdmUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21taXR0ZXIuZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgd2hpbGUgKGlzRGlyZWN0aXZlKHRoaXMudmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IG5vQ2hhbmdlO1xuICAgICAgICAgICAgZGlyZWN0aXZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZhbHVlID09PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tbWl0dGVyLmNvbW1pdCgpO1xuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBOb2RlUGFydCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluc2VydHMgdGhpcyBwYXJ0IGludG8gYSBjb250YWluZXIuXG4gICAgICpcbiAgICAgKiBUaGlzIHBhcnQgbXVzdCBiZSBlbXB0eSwgYXMgaXRzIGNvbnRlbnRzIGFyZSBub3QgYXV0b21hdGljYWxseSBtb3ZlZC5cbiAgICAgKi9cbiAgICBhcHBlbmRJbnRvKGNvbnRhaW5lcikge1xuICAgICAgICB0aGlzLnN0YXJ0Tm9kZSA9IGNvbnRhaW5lci5hcHBlbmRDaGlsZChjcmVhdGVNYXJrZXIoKSk7XG4gICAgICAgIHRoaXMuZW5kTm9kZSA9IGNvbnRhaW5lci5hcHBlbmRDaGlsZChjcmVhdGVNYXJrZXIoKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluc2VydHMgdGhpcyBwYXJ0IGJldHdlZW4gYHJlZmAgYW5kIGByZWZgJ3MgbmV4dCBzaWJsaW5nLiBCb3RoIGByZWZgIGFuZFxuICAgICAqIGl0cyBuZXh0IHNpYmxpbmcgbXVzdCBiZSBzdGF0aWMsIHVuY2hhbmdpbmcgbm9kZXMgc3VjaCBhcyB0aG9zZSB0aGF0IGFwcGVhclxuICAgICAqIGluIGEgbGl0ZXJhbCBzZWN0aW9uIG9mIGEgdGVtcGxhdGUuXG4gICAgICpcbiAgICAgKiBUaGlzIHBhcnQgbXVzdCBiZSBlbXB0eSwgYXMgaXRzIGNvbnRlbnRzIGFyZSBub3QgYXV0b21hdGljYWxseSBtb3ZlZC5cbiAgICAgKi9cbiAgICBpbnNlcnRBZnRlck5vZGUocmVmKSB7XG4gICAgICAgIHRoaXMuc3RhcnROb2RlID0gcmVmO1xuICAgICAgICB0aGlzLmVuZE5vZGUgPSByZWYubmV4dFNpYmxpbmc7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgdGhpcyBwYXJ0IGludG8gYSBwYXJlbnQgcGFydC5cbiAgICAgKlxuICAgICAqIFRoaXMgcGFydCBtdXN0IGJlIGVtcHR5LCBhcyBpdHMgY29udGVudHMgYXJlIG5vdCBhdXRvbWF0aWNhbGx5IG1vdmVkLlxuICAgICAqL1xuICAgIGFwcGVuZEludG9QYXJ0KHBhcnQpIHtcbiAgICAgICAgcGFydC5faW5zZXJ0KHRoaXMuc3RhcnROb2RlID0gY3JlYXRlTWFya2VyKCkpO1xuICAgICAgICBwYXJ0Ll9pbnNlcnQodGhpcy5lbmROb2RlID0gY3JlYXRlTWFya2VyKCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIHRoaXMgcGFydCBhZnRlciBgcmVmYFxuICAgICAqXG4gICAgICogVGhpcyBwYXJ0IG11c3QgYmUgZW1wdHksIGFzIGl0cyBjb250ZW50cyBhcmUgbm90IGF1dG9tYXRpY2FsbHkgbW92ZWQuXG4gICAgICovXG4gICAgaW5zZXJ0QWZ0ZXJQYXJ0KHJlZikge1xuICAgICAgICByZWYuX2luc2VydCh0aGlzLnN0YXJ0Tm9kZSA9IGNyZWF0ZU1hcmtlcigpKTtcbiAgICAgICAgdGhpcy5lbmROb2RlID0gcmVmLmVuZE5vZGU7XG4gICAgICAgIHJlZi5lbmROb2RlID0gdGhpcy5zdGFydE5vZGU7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBjb21taXQoKSB7XG4gICAgICAgIHdoaWxlIChpc0RpcmVjdGl2ZSh0aGlzLl9wZW5kaW5nVmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLl9wZW5kaW5nVmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSBub0NoYW5nZTtcbiAgICAgICAgICAgIGRpcmVjdGl2ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuX3BlbmRpbmdWYWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlID09PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1ByaW1pdGl2ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdGhpcy52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRleHQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgVGVtcGxhdGVSZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRlbXBsYXRlUmVzdWx0KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgICAgICAgICB2YWx1ZVtTeW1ib2wuaXRlcmF0b3JdKSB7XG4gICAgICAgICAgICB0aGlzLl9jb21taXRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IG5vdGhpbmcpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBub3RoaW5nO1xuICAgICAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2ssIHdpbGwgcmVuZGVyIHRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb25cbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdFRleHQodmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9pbnNlcnQobm9kZSkge1xuICAgICAgICB0aGlzLmVuZE5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgdGhpcy5lbmROb2RlKTtcbiAgICB9XG4gICAgX2NvbW1pdE5vZGUodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9pbnNlcnQodmFsdWUpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIF9jb21taXRUZXh0KHZhbHVlKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLnN0YXJ0Tm9kZS5uZXh0U2libGluZztcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZTtcbiAgICAgICAgaWYgKG5vZGUgPT09IHRoaXMuZW5kTm9kZS5wcmV2aW91c1NpYmxpbmcgJiZcbiAgICAgICAgICAgIG5vZGUubm9kZVR5cGUgPT09IDMgLyogTm9kZS5URVhUX05PREUgKi8pIHtcbiAgICAgICAgICAgIC8vIElmIHdlIG9ubHkgaGF2ZSBhIHNpbmdsZSB0ZXh0IG5vZGUgYmV0d2VlbiB0aGUgbWFya2Vycywgd2UgY2FuIGp1c3RcbiAgICAgICAgICAgIC8vIHNldCBpdHMgdmFsdWUsIHJhdGhlciB0aGFuIHJlcGxhY2luZyBpdC5cbiAgICAgICAgICAgIC8vIFRPRE8oanVzdGluZmFnbmFuaSk6IENhbiB3ZSBqdXN0IGNoZWNrIGlmIHRoaXMudmFsdWUgaXMgcHJpbWl0aXZlP1xuICAgICAgICAgICAgbm9kZS5kYXRhID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jb21taXROb2RlKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IFN0cmluZyh2YWx1ZSkpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIF9jb21taXRUZW1wbGF0ZVJlc3VsdCh2YWx1ZSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZUZhY3RvcnkodmFsdWUpO1xuICAgICAgICBpZiAodGhpcy52YWx1ZSBpbnN0YW5jZW9mIFRlbXBsYXRlSW5zdGFuY2UgJiZcbiAgICAgICAgICAgIHRoaXMudmFsdWUudGVtcGxhdGUgPT09IHRlbXBsYXRlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlLnVwZGF0ZSh2YWx1ZS52YWx1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHdlIHByb3BhZ2F0ZSB0aGUgdGVtcGxhdGUgcHJvY2Vzc29yIGZyb20gdGhlIFRlbXBsYXRlUmVzdWx0XG4gICAgICAgICAgICAvLyBzbyB0aGF0IHdlIHVzZSBpdHMgc3ludGF4IGV4dGVuc2lvbiwgZXRjLiBUaGUgdGVtcGxhdGUgZmFjdG9yeSBjb21lc1xuICAgICAgICAgICAgLy8gZnJvbSB0aGUgcmVuZGVyIGZ1bmN0aW9uIG9wdGlvbnMgc28gdGhhdCBpdCBjYW4gY29udHJvbCB0ZW1wbGF0ZVxuICAgICAgICAgICAgLy8gY2FjaGluZyBhbmQgcHJlcHJvY2Vzc2luZy5cbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IFRlbXBsYXRlSW5zdGFuY2UodGVtcGxhdGUsIHZhbHVlLnByb2Nlc3NvciwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IGZyYWdtZW50ID0gaW5zdGFuY2UuX2Nsb25lKCk7XG4gICAgICAgICAgICBpbnN0YW5jZS51cGRhdGUodmFsdWUudmFsdWVzKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbW1pdE5vZGUoZnJhZ21lbnQpO1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9jb21taXRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgICAvLyBGb3IgYW4gSXRlcmFibGUsIHdlIGNyZWF0ZSBhIG5ldyBJbnN0YW5jZVBhcnQgcGVyIGl0ZW0sIHRoZW4gc2V0IGl0c1xuICAgICAgICAvLyB2YWx1ZSB0byB0aGUgaXRlbS4gVGhpcyBpcyBhIGxpdHRsZSBiaXQgb2Ygb3ZlcmhlYWQgZm9yIGV2ZXJ5IGl0ZW0gaW5cbiAgICAgICAgLy8gYW4gSXRlcmFibGUsIGJ1dCBpdCBsZXRzIHVzIHJlY3Vyc2UgZWFzaWx5IGFuZCBlZmZpY2llbnRseSB1cGRhdGUgQXJyYXlzXG4gICAgICAgIC8vIG9mIFRlbXBsYXRlUmVzdWx0cyB0aGF0IHdpbGwgYmUgY29tbW9ubHkgcmV0dXJuZWQgZnJvbSBleHByZXNzaW9ucyBsaWtlOlxuICAgICAgICAvLyBhcnJheS5tYXAoKGkpID0+IGh0bWxgJHtpfWApLCBieSByZXVzaW5nIGV4aXN0aW5nIFRlbXBsYXRlSW5zdGFuY2VzLlxuICAgICAgICAvLyBJZiBfdmFsdWUgaXMgYW4gYXJyYXksIHRoZW4gdGhlIHByZXZpb3VzIHJlbmRlciB3YXMgb2YgYW5cbiAgICAgICAgLy8gaXRlcmFibGUgYW5kIF92YWx1ZSB3aWxsIGNvbnRhaW4gdGhlIE5vZGVQYXJ0cyBmcm9tIHRoZSBwcmV2aW91c1xuICAgICAgICAvLyByZW5kZXIuIElmIF92YWx1ZSBpcyBub3QgYW4gYXJyYXksIGNsZWFyIHRoaXMgcGFydCBhbmQgbWFrZSBhIG5ld1xuICAgICAgICAvLyBhcnJheSBmb3IgTm9kZVBhcnRzLlxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGhpcy52YWx1ZSkpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBMZXRzIHVzIGtlZXAgdHJhY2sgb2YgaG93IG1hbnkgaXRlbXMgd2Ugc3RhbXBlZCBzbyB3ZSBjYW4gY2xlYXIgbGVmdG92ZXJcbiAgICAgICAgLy8gaXRlbXMgZnJvbSBhIHByZXZpb3VzIHJlbmRlclxuICAgICAgICBjb25zdCBpdGVtUGFydHMgPSB0aGlzLnZhbHVlO1xuICAgICAgICBsZXQgcGFydEluZGV4ID0gMDtcbiAgICAgICAgbGV0IGl0ZW1QYXJ0O1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgdmFsdWUpIHtcbiAgICAgICAgICAgIC8vIFRyeSB0byByZXVzZSBhbiBleGlzdGluZyBwYXJ0XG4gICAgICAgICAgICBpdGVtUGFydCA9IGl0ZW1QYXJ0c1twYXJ0SW5kZXhdO1xuICAgICAgICAgICAgLy8gSWYgbm8gZXhpc3RpbmcgcGFydCwgY3JlYXRlIGEgbmV3IG9uZVxuICAgICAgICAgICAgaWYgKGl0ZW1QYXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpdGVtUGFydCA9IG5ldyBOb2RlUGFydCh0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGl0ZW1QYXJ0cy5wdXNoKGl0ZW1QYXJ0KTtcbiAgICAgICAgICAgICAgICBpZiAocGFydEluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1QYXJ0LmFwcGVuZEludG9QYXJ0KHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbVBhcnQuaW5zZXJ0QWZ0ZXJQYXJ0KGl0ZW1QYXJ0c1twYXJ0SW5kZXggLSAxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaXRlbVBhcnQuc2V0VmFsdWUoaXRlbSk7XG4gICAgICAgICAgICBpdGVtUGFydC5jb21taXQoKTtcbiAgICAgICAgICAgIHBhcnRJbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJ0SW5kZXggPCBpdGVtUGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBUcnVuY2F0ZSB0aGUgcGFydHMgYXJyYXkgc28gX3ZhbHVlIHJlZmxlY3RzIHRoZSBjdXJyZW50IHN0YXRlXG4gICAgICAgICAgICBpdGVtUGFydHMubGVuZ3RoID0gcGFydEluZGV4O1xuICAgICAgICAgICAgdGhpcy5jbGVhcihpdGVtUGFydCAmJiBpdGVtUGFydC5lbmROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjbGVhcihzdGFydE5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSkge1xuICAgICAgICByZW1vdmVOb2Rlcyh0aGlzLnN0YXJ0Tm9kZS5wYXJlbnROb2RlLCBzdGFydE5vZGUubmV4dFNpYmxpbmcsIHRoaXMuZW5kTm9kZSk7XG4gICAgfVxufVxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgYm9vbGVhbiBhdHRyaWJ1dGUsIHJvdWdobHkgYXMgZGVmaW5lZCBpbiB0aGUgSFRNTFxuICogc3BlY2lmaWNhdGlvbi5cbiAqXG4gKiBJZiB0aGUgdmFsdWUgaXMgdHJ1dGh5LCB0aGVuIHRoZSBhdHRyaWJ1dGUgaXMgcHJlc2VudCB3aXRoIGEgdmFsdWUgb2ZcbiAqICcnLiBJZiB0aGUgdmFsdWUgaXMgZmFsc2V5LCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb29sZWFuQXR0cmlidXRlUGFydCB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgbmFtZSwgc3RyaW5ncykge1xuICAgICAgICB0aGlzLnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChzdHJpbmdzLmxlbmd0aCAhPT0gMiB8fCBzdHJpbmdzWzBdICE9PSAnJyB8fCBzdHJpbmdzWzFdICE9PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCb29sZWFuIGF0dHJpYnV0ZXMgY2FuIG9ubHkgY29udGFpbiBhIHNpbmdsZSBleHByZXNzaW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zdHJpbmdzID0gc3RyaW5ncztcbiAgICB9XG4gICAgc2V0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1ZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgd2hpbGUgKGlzRGlyZWN0aXZlKHRoaXMuX3BlbmRpbmdWYWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMuX3BlbmRpbmdWYWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IG5vQ2hhbmdlO1xuICAgICAgICAgICAgZGlyZWN0aXZlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wZW5kaW5nVmFsdWUgPT09IG5vQ2hhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSAhIXRoaXMuX3BlbmRpbmdWYWx1ZTtcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMubmFtZSwgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSh0aGlzLm5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1ZhbHVlID0gbm9DaGFuZ2U7XG4gICAgfVxufVxuLyoqXG4gKiBTZXRzIGF0dHJpYnV0ZSB2YWx1ZXMgZm9yIFByb3BlcnR5UGFydHMsIHNvIHRoYXQgdGhlIHZhbHVlIGlzIG9ubHkgc2V0IG9uY2VcbiAqIGV2ZW4gaWYgdGhlcmUgYXJlIG11bHRpcGxlIHBhcnRzIGZvciBhIHByb3BlcnR5LlxuICpcbiAqIElmIGFuIGV4cHJlc3Npb24gY29udHJvbHMgdGhlIHdob2xlIHByb3BlcnR5IHZhbHVlLCB0aGVuIHRoZSB2YWx1ZSBpcyBzaW1wbHlcbiAqIGFzc2lnbmVkIHRvIHRoZSBwcm9wZXJ0eSB1bmRlciBjb250cm9sLiBJZiB0aGVyZSBhcmUgc3RyaW5nIGxpdGVyYWxzIG9yXG4gKiBtdWx0aXBsZSBleHByZXNzaW9ucywgdGhlbiB0aGUgc3RyaW5ncyBhcmUgZXhwcmVzc2lvbnMgYXJlIGludGVycG9sYXRlZCBpbnRvXG4gKiBhIHN0cmluZyBmaXJzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5Q29tbWl0dGVyIGV4dGVuZHMgQXR0cmlidXRlQ29tbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBuYW1lLCBzdHJpbmdzKSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MpO1xuICAgICAgICB0aGlzLnNpbmdsZSA9XG4gICAgICAgICAgICAoc3RyaW5ncy5sZW5ndGggPT09IDIgJiYgc3RyaW5nc1swXSA9PT0gJycgJiYgc3RyaW5nc1sxXSA9PT0gJycpO1xuICAgIH1cbiAgICBfY3JlYXRlUGFydCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wZXJ0eVBhcnQodGhpcyk7XG4gICAgfVxuICAgIF9nZXRWYWx1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2luZ2xlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJ0c1swXS52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIuX2dldFZhbHVlKCk7XG4gICAgfVxuICAgIGNvbW1pdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlydHkpIHtcbiAgICAgICAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudFt0aGlzLm5hbWVdID0gdGhpcy5fZ2V0VmFsdWUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCBjbGFzcyBQcm9wZXJ0eVBhcnQgZXh0ZW5kcyBBdHRyaWJ1dGVQYXJ0IHtcbn1cbi8vIERldGVjdCBldmVudCBsaXN0ZW5lciBvcHRpb25zIHN1cHBvcnQuIElmIHRoZSBgY2FwdHVyZWAgcHJvcGVydHkgaXMgcmVhZFxuLy8gZnJvbSB0aGUgb3B0aW9ucyBvYmplY3QsIHRoZW4gb3B0aW9ucyBhcmUgc3VwcG9ydGVkLiBJZiBub3QsIHRoZW4gdGhlIHRocmlkXG4vLyBhcmd1bWVudCB0byBhZGQvcmVtb3ZlRXZlbnRMaXN0ZW5lciBpcyBpbnRlcnByZXRlZCBhcyB0aGUgYm9vbGVhbiBjYXB0dXJlXG4vLyB2YWx1ZSBzbyB3ZSBzaG91bGQgb25seSBwYXNzIHRoZSBgY2FwdHVyZWAgcHJvcGVydHkuXG5sZXQgZXZlbnRPcHRpb25zU3VwcG9ydGVkID0gZmFsc2U7XG50cnkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgIGdldCBjYXB0dXJlKCkge1xuICAgICAgICAgICAgZXZlbnRPcHRpb25zU3VwcG9ydGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0ZXN0Jywgb3B0aW9ucywgb3B0aW9ucyk7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0ZXN0Jywgb3B0aW9ucywgb3B0aW9ucyk7XG59XG5jYXRjaCAoX2UpIHtcbn1cbmV4cG9ydCBjbGFzcyBFdmVudFBhcnQge1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIGV2ZW50TmFtZSwgZXZlbnRDb250ZXh0KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5ldmVudE5hbWUgPSBldmVudE5hbWU7XG4gICAgICAgIHRoaXMuZXZlbnRDb250ZXh0ID0gZXZlbnRDb250ZXh0O1xuICAgICAgICB0aGlzLl9ib3VuZEhhbmRsZUV2ZW50ID0gKGUpID0+IHRoaXMuaGFuZGxlRXZlbnQoZSk7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdWYWx1ZSA9IHZhbHVlO1xuICAgIH1cbiAgICBjb21taXQoKSB7XG4gICAgICAgIHdoaWxlIChpc0RpcmVjdGl2ZSh0aGlzLl9wZW5kaW5nVmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLl9wZW5kaW5nVmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVmFsdWUgPSBub0NoYW5nZTtcbiAgICAgICAgICAgIGRpcmVjdGl2ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcGVuZGluZ1ZhbHVlID09PSBub0NoYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5ld0xpc3RlbmVyID0gdGhpcy5fcGVuZGluZ1ZhbHVlO1xuICAgICAgICBjb25zdCBvbGRMaXN0ZW5lciA9IHRoaXMudmFsdWU7XG4gICAgICAgIGNvbnN0IHNob3VsZFJlbW92ZUxpc3RlbmVyID0gbmV3TGlzdGVuZXIgPT0gbnVsbCB8fFxuICAgICAgICAgICAgb2xkTGlzdGVuZXIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgIChuZXdMaXN0ZW5lci5jYXB0dXJlICE9PSBvbGRMaXN0ZW5lci5jYXB0dXJlIHx8XG4gICAgICAgICAgICAgICAgICAgIG5ld0xpc3RlbmVyLm9uY2UgIT09IG9sZExpc3RlbmVyLm9uY2UgfHxcbiAgICAgICAgICAgICAgICAgICAgbmV3TGlzdGVuZXIucGFzc2l2ZSAhPT0gb2xkTGlzdGVuZXIucGFzc2l2ZSk7XG4gICAgICAgIGNvbnN0IHNob3VsZEFkZExpc3RlbmVyID0gbmV3TGlzdGVuZXIgIT0gbnVsbCAmJiAob2xkTGlzdGVuZXIgPT0gbnVsbCB8fCBzaG91bGRSZW1vdmVMaXN0ZW5lcik7XG4gICAgICAgIGlmIChzaG91bGRSZW1vdmVMaXN0ZW5lcikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMuX2JvdW5kSGFuZGxlRXZlbnQsIHRoaXMuX29wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaG91bGRBZGRMaXN0ZW5lcikge1xuICAgICAgICAgICAgdGhpcy5fb3B0aW9ucyA9IGdldE9wdGlvbnMobmV3TGlzdGVuZXIpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMuX2JvdW5kSGFuZGxlRXZlbnQsIHRoaXMuX29wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWUgPSBuZXdMaXN0ZW5lcjtcbiAgICAgICAgdGhpcy5fcGVuZGluZ1ZhbHVlID0gbm9DaGFuZ2U7XG4gICAgfVxuICAgIGhhbmRsZUV2ZW50KGV2ZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy52YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy52YWx1ZS5jYWxsKHRoaXMuZXZlbnRDb250ZXh0IHx8IHRoaXMuZWxlbWVudCwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52YWx1ZS5oYW5kbGVFdmVudChldmVudCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyBXZSBjb3B5IG9wdGlvbnMgYmVjYXVzZSBvZiB0aGUgaW5jb25zaXN0ZW50IGJlaGF2aW9yIG9mIGJyb3dzZXJzIHdoZW4gcmVhZGluZ1xuLy8gdGhlIHRoaXJkIGFyZ3VtZW50IG9mIGFkZC9yZW1vdmVFdmVudExpc3RlbmVyLiBJRTExIGRvZXNuJ3Qgc3VwcG9ydCBvcHRpb25zXG4vLyBhdCBhbGwuIENocm9tZSA0MSBvbmx5IHJlYWRzIGBjYXB0dXJlYCBpZiB0aGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0LlxuY29uc3QgZ2V0T3B0aW9ucyA9IChvKSA9PiBvICYmXG4gICAgKGV2ZW50T3B0aW9uc1N1cHBvcnRlZCA/XG4gICAgICAgIHsgY2FwdHVyZTogby5jYXB0dXJlLCBwYXNzaXZlOiBvLnBhc3NpdmUsIG9uY2U6IG8ub25jZSB9IDpcbiAgICAgICAgby5jYXB0dXJlKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcnRzLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNyBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbmltcG9ydCB7IEF0dHJpYnV0ZUNvbW1pdHRlciwgQm9vbGVhbkF0dHJpYnV0ZVBhcnQsIEV2ZW50UGFydCwgTm9kZVBhcnQsIFByb3BlcnR5Q29tbWl0dGVyIH0gZnJvbSAnLi9wYXJ0cy5qcyc7XG4vKipcbiAqIENyZWF0ZXMgUGFydHMgd2hlbiBhIHRlbXBsYXRlIGlzIGluc3RhbnRpYXRlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIERlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciB7XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHBhcnRzIGZvciBhbiBhdHRyaWJ1dGUtcG9zaXRpb24gYmluZGluZywgZ2l2ZW4gdGhlIGV2ZW50LCBhdHRyaWJ1dGVcbiAgICAgKiBuYW1lLCBhbmQgc3RyaW5nIGxpdGVyYWxzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgYmluZGluZ1xuICAgICAqIEBwYXJhbSBuYW1lICBUaGUgYXR0cmlidXRlIG5hbWVcbiAgICAgKiBAcGFyYW0gc3RyaW5ncyBUaGUgc3RyaW5nIGxpdGVyYWxzLiBUaGVyZSBhcmUgYWx3YXlzIGF0IGxlYXN0IHR3byBzdHJpbmdzLFxuICAgICAqICAgZXZlbnQgZm9yIGZ1bGx5LWNvbnRyb2xsZWQgYmluZGluZ3Mgd2l0aCBhIHNpbmdsZSBleHByZXNzaW9uLlxuICAgICAqL1xuICAgIGhhbmRsZUF0dHJpYnV0ZUV4cHJlc3Npb25zKGVsZW1lbnQsIG5hbWUsIHN0cmluZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgcHJlZml4ID0gbmFtZVswXTtcbiAgICAgICAgaWYgKHByZWZpeCA9PT0gJy4nKSB7XG4gICAgICAgICAgICBjb25zdCBjb21pdHRlciA9IG5ldyBQcm9wZXJ0eUNvbW1pdHRlcihlbGVtZW50LCBuYW1lLnNsaWNlKDEpLCBzdHJpbmdzKTtcbiAgICAgICAgICAgIHJldHVybiBjb21pdHRlci5wYXJ0cztcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJlZml4ID09PSAnQCcpIHtcbiAgICAgICAgICAgIHJldHVybiBbbmV3IEV2ZW50UGFydChlbGVtZW50LCBuYW1lLnNsaWNlKDEpLCBvcHRpb25zLmV2ZW50Q29udGV4dCldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmVmaXggPT09ICc/Jykge1xuICAgICAgICAgICAgcmV0dXJuIFtuZXcgQm9vbGVhbkF0dHJpYnV0ZVBhcnQoZWxlbWVudCwgbmFtZS5zbGljZSgxKSwgc3RyaW5ncyldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbWl0dGVyID0gbmV3IEF0dHJpYnV0ZUNvbW1pdHRlcihlbGVtZW50LCBuYW1lLCBzdHJpbmdzKTtcbiAgICAgICAgcmV0dXJuIGNvbWl0dGVyLnBhcnRzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgcGFydHMgZm9yIGEgdGV4dC1wb3NpdGlvbiBiaW5kaW5nLlxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZUZhY3RvcnlcbiAgICAgKi9cbiAgICBoYW5kbGVUZXh0RXhwcmVzc2lvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgTm9kZVBhcnQob3B0aW9ucyk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGRlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciA9IG5ldyBEZWZhdWx0VGVtcGxhdGVQcm9jZXNzb3IoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlZmF1bHQtdGVtcGxhdGUtcHJvY2Vzc29yLmpzLm1hcCIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAoYykgMjAxNyBUaGUgUG9seW1lciBQcm9qZWN0IEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBUaGlzIGNvZGUgbWF5IG9ubHkgYmUgdXNlZCB1bmRlciB0aGUgQlNEIHN0eWxlIGxpY2Vuc2UgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9MSUNFTlNFLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBhdXRob3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0FVVEhPUlMudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGNvbnRyaWJ1dG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9DT05UUklCVVRPUlMudHh0XG4gKiBDb2RlIGRpc3RyaWJ1dGVkIGJ5IEdvb2dsZSBhcyBwYXJ0IG9mIHRoZSBwb2x5bWVyIHByb2plY3QgaXMgYWxzb1xuICogc3ViamVjdCB0byBhbiBhZGRpdGlvbmFsIElQIHJpZ2h0cyBncmFudCBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL1BBVEVOVFMudHh0XG4gKi9cbmltcG9ydCB7IG1hcmtlciwgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlLmpzJztcbi8qKlxuICogVGhlIGRlZmF1bHQgVGVtcGxhdGVGYWN0b3J5IHdoaWNoIGNhY2hlcyBUZW1wbGF0ZXMga2V5ZWQgb25cbiAqIHJlc3VsdC50eXBlIGFuZCByZXN1bHQuc3RyaW5ncy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlRmFjdG9yeShyZXN1bHQpIHtcbiAgICBsZXQgdGVtcGxhdGVDYWNoZSA9IHRlbXBsYXRlQ2FjaGVzLmdldChyZXN1bHQudHlwZSk7XG4gICAgaWYgKHRlbXBsYXRlQ2FjaGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0ZW1wbGF0ZUNhY2hlID0ge1xuICAgICAgICAgICAgc3RyaW5nc0FycmF5OiBuZXcgV2Vha01hcCgpLFxuICAgICAgICAgICAga2V5U3RyaW5nOiBuZXcgTWFwKClcbiAgICAgICAgfTtcbiAgICAgICAgdGVtcGxhdGVDYWNoZXMuc2V0KHJlc3VsdC50eXBlLCB0ZW1wbGF0ZUNhY2hlKTtcbiAgICB9XG4gICAgbGV0IHRlbXBsYXRlID0gdGVtcGxhdGVDYWNoZS5zdHJpbmdzQXJyYXkuZ2V0KHJlc3VsdC5zdHJpbmdzKTtcbiAgICBpZiAodGVtcGxhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxuICAgIC8vIElmIHRoZSBUZW1wbGF0ZVN0cmluZ3NBcnJheSBpcyBuZXcsIGdlbmVyYXRlIGEga2V5IGZyb20gdGhlIHN0cmluZ3NcbiAgICAvLyBUaGlzIGtleSBpcyBzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzIHdpdGggaWRlbnRpY2FsIGNvbnRlbnRcbiAgICBjb25zdCBrZXkgPSByZXN1bHQuc3RyaW5ncy5qb2luKG1hcmtlcik7XG4gICAgLy8gQ2hlY2sgaWYgd2UgYWxyZWFkeSBoYXZlIGEgVGVtcGxhdGUgZm9yIHRoaXMga2V5XG4gICAgdGVtcGxhdGUgPSB0ZW1wbGF0ZUNhY2hlLmtleVN0cmluZy5nZXQoa2V5KTtcbiAgICBpZiAodGVtcGxhdGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBJZiB3ZSBoYXZlIG5vdCBzZWVuIHRoaXMga2V5IGJlZm9yZSwgY3JlYXRlIGEgbmV3IFRlbXBsYXRlXG4gICAgICAgIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlKHJlc3VsdCwgcmVzdWx0LmdldFRlbXBsYXRlRWxlbWVudCgpKTtcbiAgICAgICAgLy8gQ2FjaGUgdGhlIFRlbXBsYXRlIGZvciB0aGlzIGtleVxuICAgICAgICB0ZW1wbGF0ZUNhY2hlLmtleVN0cmluZy5zZXQoa2V5LCB0ZW1wbGF0ZSk7XG4gICAgfVxuICAgIC8vIENhY2hlIGFsbCBmdXR1cmUgcXVlcmllcyBmb3IgdGhpcyBUZW1wbGF0ZVN0cmluZ3NBcnJheVxuICAgIHRlbXBsYXRlQ2FjaGUuc3RyaW5nc0FycmF5LnNldChyZXN1bHQuc3RyaW5ncywgdGVtcGxhdGUpO1xuICAgIHJldHVybiB0ZW1wbGF0ZTtcbn1cbmV4cG9ydCBjb25zdCB0ZW1wbGF0ZUNhY2hlcyA9IG5ldyBNYXAoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRlbXBsYXRlLWZhY3RvcnkuanMubWFwIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IChjKSAyMDE3IFRoZSBQb2x5bWVyIFByb2plY3QgQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFRoaXMgY29kZSBtYXkgb25seSBiZSB1c2VkIHVuZGVyIHRoZSBCU0Qgc3R5bGUgbGljZW5zZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0xJQ0VOU0UudHh0XG4gKiBUaGUgY29tcGxldGUgc2V0IG9mIGF1dGhvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQVVUSE9SUy50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgY29udHJpYnV0b3JzIG1heSBiZSBmb3VuZCBhdFxuICogaHR0cDovL3BvbHltZXIuZ2l0aHViLmlvL0NPTlRSSUJVVE9SUy50eHRcbiAqIENvZGUgZGlzdHJpYnV0ZWQgYnkgR29vZ2xlIGFzIHBhcnQgb2YgdGhlIHBvbHltZXIgcHJvamVjdCBpcyBhbHNvXG4gKiBzdWJqZWN0IHRvIGFuIGFkZGl0aW9uYWwgSVAgcmlnaHRzIGdyYW50IGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vUEFURU5UUy50eHRcbiAqL1xuLyoqXG4gKiBAbW9kdWxlIGxpdC1odG1sXG4gKi9cbmltcG9ydCB7IHJlbW92ZU5vZGVzIH0gZnJvbSAnLi9kb20uanMnO1xuaW1wb3J0IHsgTm9kZVBhcnQgfSBmcm9tICcuL3BhcnRzLmpzJztcbmltcG9ydCB7IHRlbXBsYXRlRmFjdG9yeSB9IGZyb20gJy4vdGVtcGxhdGUtZmFjdG9yeS5qcyc7XG5leHBvcnQgY29uc3QgcGFydHMgPSBuZXcgV2Vha01hcCgpO1xuLyoqXG4gKiBSZW5kZXJzIGEgdGVtcGxhdGUgdG8gYSBjb250YWluZXIuXG4gKlxuICogVG8gdXBkYXRlIGEgY29udGFpbmVyIHdpdGggbmV3IHZhbHVlcywgcmVldmFsdWF0ZSB0aGUgdGVtcGxhdGUgbGl0ZXJhbCBhbmRcbiAqIGNhbGwgYHJlbmRlcmAgd2l0aCB0aGUgbmV3IHJlc3VsdC5cbiAqXG4gKiBAcGFyYW0gcmVzdWx0IGEgVGVtcGxhdGVSZXN1bHQgY3JlYXRlZCBieSBldmFsdWF0aW5nIGEgdGVtcGxhdGUgdGFnIGxpa2VcbiAqICAgICBgaHRtbGAgb3IgYHN2Z2AuXG4gKiBAcGFyYW0gY29udGFpbmVyIEEgRE9NIHBhcmVudCB0byByZW5kZXIgdG8uIFRoZSBlbnRpcmUgY29udGVudHMgYXJlIGVpdGhlclxuICogICAgIHJlcGxhY2VkLCBvciBlZmZpY2llbnRseSB1cGRhdGVkIGlmIHRoZSBzYW1lIHJlc3VsdCB0eXBlIHdhcyBwcmV2aW91c1xuICogICAgIHJlbmRlcmVkIHRoZXJlLlxuICogQHBhcmFtIG9wdGlvbnMgUmVuZGVyT3B0aW9ucyBmb3IgdGhlIGVudGlyZSByZW5kZXIgdHJlZSByZW5kZXJlZCB0byB0aGlzXG4gKiAgICAgY29udGFpbmVyLiBSZW5kZXIgb3B0aW9ucyBtdXN0ICpub3QqIGNoYW5nZSBiZXR3ZWVuIHJlbmRlcnMgdG8gdGhlIHNhbWVcbiAqICAgICBjb250YWluZXIsIGFzIHRob3NlIGNoYW5nZXMgd2lsbCBub3QgZWZmZWN0IHByZXZpb3VzbHkgcmVuZGVyZWQgRE9NLlxuICovXG5leHBvcnQgY29uc3QgcmVuZGVyID0gKHJlc3VsdCwgY29udGFpbmVyLCBvcHRpb25zKSA9PiB7XG4gICAgbGV0IHBhcnQgPSBwYXJ0cy5nZXQoY29udGFpbmVyKTtcbiAgICBpZiAocGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlbW92ZU5vZGVzKGNvbnRhaW5lciwgY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgICAgICBwYXJ0cy5zZXQoY29udGFpbmVyLCBwYXJ0ID0gbmV3IE5vZGVQYXJ0KE9iamVjdC5hc3NpZ24oeyB0ZW1wbGF0ZUZhY3RvcnkgfSwgb3B0aW9ucykpKTtcbiAgICAgICAgcGFydC5hcHBlbmRJbnRvKGNvbnRhaW5lcik7XG4gICAgfVxuICAgIHBhcnQuc2V0VmFsdWUocmVzdWx0KTtcbiAgICBwYXJ0LmNvbW1pdCgpO1xufTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlbmRlci5qcy5tYXAiLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgVGhlIFBvbHltZXIgUHJvamVjdCBBdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICogVGhpcyBjb2RlIG1heSBvbmx5IGJlIHVzZWQgdW5kZXIgdGhlIEJTRCBzdHlsZSBsaWNlbnNlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vTElDRU5TRS50eHRcbiAqIFRoZSBjb21wbGV0ZSBzZXQgb2YgYXV0aG9ycyBtYXkgYmUgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9BVVRIT1JTLnR4dFxuICogVGhlIGNvbXBsZXRlIHNldCBvZiBjb250cmlidXRvcnMgbWF5IGJlIGZvdW5kIGF0XG4gKiBodHRwOi8vcG9seW1lci5naXRodWIuaW8vQ09OVFJJQlVUT1JTLnR4dFxuICogQ29kZSBkaXN0cmlidXRlZCBieSBHb29nbGUgYXMgcGFydCBvZiB0aGUgcG9seW1lciBwcm9qZWN0IGlzIGFsc29cbiAqIHN1YmplY3QgdG8gYW4gYWRkaXRpb25hbCBJUCByaWdodHMgZ3JhbnQgZm91bmQgYXRcbiAqIGh0dHA6Ly9wb2x5bWVyLmdpdGh1Yi5pby9QQVRFTlRTLnR4dFxuICovXG4vKipcbiAqXG4gKiBNYWluIGxpdC1odG1sIG1vZHVsZS5cbiAqXG4gKiBNYWluIGV4cG9ydHM6XG4gKlxuICogLSAgW1todG1sXV1cbiAqIC0gIFtbc3ZnXV1cbiAqIC0gIFtbcmVuZGVyXV1cbiAqXG4gKiBAbW9kdWxlIGxpdC1odG1sXG4gKiBAcHJlZmVycmVkXG4gKi9cbi8qKlxuICogRG8gbm90IHJlbW92ZSB0aGlzIGNvbW1lbnQ7IGl0IGtlZXBzIHR5cGVkb2MgZnJvbSBtaXNwbGFjaW5nIHRoZSBtb2R1bGVcbiAqIGRvY3MuXG4gKi9cbmltcG9ydCB7IGRlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciB9IGZyb20gJy4vbGliL2RlZmF1bHQtdGVtcGxhdGUtcHJvY2Vzc29yLmpzJztcbmltcG9ydCB7IFNWR1RlbXBsYXRlUmVzdWx0LCBUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJy4vbGliL3RlbXBsYXRlLXJlc3VsdC5qcyc7XG5leHBvcnQgeyBEZWZhdWx0VGVtcGxhdGVQcm9jZXNzb3IsIGRlZmF1bHRUZW1wbGF0ZVByb2Nlc3NvciB9IGZyb20gJy4vbGliL2RlZmF1bHQtdGVtcGxhdGUtcHJvY2Vzc29yLmpzJztcbmV4cG9ydCB7IGRpcmVjdGl2ZSwgaXNEaXJlY3RpdmUgfSBmcm9tICcuL2xpYi9kaXJlY3RpdmUuanMnO1xuLy8gVE9ETyhqdXN0aW5mYWduYW5pKTogcmVtb3ZlIGxpbmUgd2hlbiB3ZSBnZXQgTm9kZVBhcnQgbW92aW5nIG1ldGhvZHNcbmV4cG9ydCB7IHJlbW92ZU5vZGVzLCByZXBhcmVudE5vZGVzIH0gZnJvbSAnLi9saWIvZG9tLmpzJztcbmV4cG9ydCB7IG5vQ2hhbmdlLCBub3RoaW5nIH0gZnJvbSAnLi9saWIvcGFydC5qcyc7XG5leHBvcnQgeyBBdHRyaWJ1dGVDb21taXR0ZXIsIEF0dHJpYnV0ZVBhcnQsIEJvb2xlYW5BdHRyaWJ1dGVQYXJ0LCBFdmVudFBhcnQsIGlzUHJpbWl0aXZlLCBOb2RlUGFydCwgUHJvcGVydHlDb21taXR0ZXIsIFByb3BlcnR5UGFydCB9IGZyb20gJy4vbGliL3BhcnRzLmpzJztcbmV4cG9ydCB7IHBhcnRzLCByZW5kZXIgfSBmcm9tICcuL2xpYi9yZW5kZXIuanMnO1xuZXhwb3J0IHsgdGVtcGxhdGVDYWNoZXMsIHRlbXBsYXRlRmFjdG9yeSB9IGZyb20gJy4vbGliL3RlbXBsYXRlLWZhY3RvcnkuanMnO1xuZXhwb3J0IHsgVGVtcGxhdGVJbnN0YW5jZSB9IGZyb20gJy4vbGliL3RlbXBsYXRlLWluc3RhbmNlLmpzJztcbmV4cG9ydCB7IFNWR1RlbXBsYXRlUmVzdWx0LCBUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJy4vbGliL3RlbXBsYXRlLXJlc3VsdC5qcyc7XG5leHBvcnQgeyBjcmVhdGVNYXJrZXIsIGlzVGVtcGxhdGVQYXJ0QWN0aXZlLCBUZW1wbGF0ZSB9IGZyb20gJy4vbGliL3RlbXBsYXRlLmpzJztcbi8vIElNUE9SVEFOVDogZG8gbm90IGNoYW5nZSB0aGUgcHJvcGVydHkgbmFtZSBvciB0aGUgYXNzaWdubWVudCBleHByZXNzaW9uLlxuLy8gVGhpcyBsaW5lIHdpbGwgYmUgdXNlZCBpbiByZWdleGVzIHRvIHNlYXJjaCBmb3IgbGl0LWh0bWwgdXNhZ2UuXG4vLyBUT0RPKGp1c3RpbmZhZ25hbmkpOiBpbmplY3QgdmVyc2lvbiBudW1iZXIgYXQgYnVpbGQgdGltZVxuKHdpbmRvd1snbGl0SHRtbFZlcnNpb25zJ10gfHwgKHdpbmRvd1snbGl0SHRtbFZlcnNpb25zJ10gPSBbXSkpLnB1c2goJzEuMC4wJyk7XG4vKipcbiAqIEludGVycHJldHMgYSB0ZW1wbGF0ZSBsaXRlcmFsIGFzIGFuIEhUTUwgdGVtcGxhdGUgdGhhdCBjYW4gZWZmaWNpZW50bHlcbiAqIHJlbmRlciB0byBhbmQgdXBkYXRlIGEgY29udGFpbmVyLlxuICovXG5leHBvcnQgY29uc3QgaHRtbCA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IG5ldyBUZW1wbGF0ZVJlc3VsdChzdHJpbmdzLCB2YWx1ZXMsICdodG1sJywgZGVmYXVsdFRlbXBsYXRlUHJvY2Vzc29yKTtcbi8qKlxuICogSW50ZXJwcmV0cyBhIHRlbXBsYXRlIGxpdGVyYWwgYXMgYW4gU1ZHIHRlbXBsYXRlIHRoYXQgY2FuIGVmZmljaWVudGx5XG4gKiByZW5kZXIgdG8gYW5kIHVwZGF0ZSBhIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGNvbnN0IHN2ZyA9IChzdHJpbmdzLCAuLi52YWx1ZXMpID0+IG5ldyBTVkdUZW1wbGF0ZVJlc3VsdChzdHJpbmdzLCB2YWx1ZXMsICdzdmcnLCBkZWZhdWx0VGVtcGxhdGVQcm9jZXNzb3IpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGl0LWh0bWwuanMubWFwIiwiY29uc3QgRklSU1QgPSAvXlteXS87XG5jb25zdCBTUEFDRVMgPSAvXFxzKyhbXFxTXSkvZztcbmNvbnN0IENBTUVMUyA9IC9bYS16XShbQS1aXSkvZztcbmNvbnN0IEtFQkFCUyA9IC8tKFthLXpdKS9nO1xuXG5leHBvcnQgZnVuY3Rpb24gY2FwaXRhbGl6ZSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gICAgcmV0dXJuIHN0cmluZyA/IHN0cmluZy5yZXBsYWNlKEZJUlNULCBzdHJpbmdbMF0udG9VcHBlckNhc2UoKSkgOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmNhcGl0YWxpemUgKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcblxuICAgIHJldHVybiBzdHJpbmcgPyBzdHJpbmcucmVwbGFjZShGSVJTVCwgc3RyaW5nWzBdLnRvTG93ZXJDYXNlKCkpIDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FtZWxDYXNlIChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG5cbiAgICBsZXQgbWF0Y2hlcztcblxuICAgIGlmIChzdHJpbmcpIHtcblxuICAgICAgICBzdHJpbmcgPSBzdHJpbmcudHJpbSgpO1xuXG4gICAgICAgIHdoaWxlICgobWF0Y2hlcyA9IFNQQUNFUy5leGVjKHN0cmluZykpKSB7XG5cbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKG1hdGNoZXNbMF0sIG1hdGNoZXNbMV0udG9VcHBlckNhc2UoKSk7XG5cbiAgICAgICAgICAgIFNQQUNFUy5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gS0VCQUJTLmV4ZWMoc3RyaW5nKSkpIHtcblxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UobWF0Y2hlc1swXSwgbWF0Y2hlc1sxXS50b1VwcGVyQ2FzZSgpKTtcblxuICAgICAgICAgICAgS0VCQUJTLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5jYXBpdGFsaXplKHN0cmluZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBrZWJhYkNhc2UgKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcblxuICAgIGxldCBtYXRjaGVzO1xuXG4gICAgaWYgKHN0cmluZykge1xuXG4gICAgICAgIHN0cmluZyA9IHN0cmluZy50cmltKCk7XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gU1BBQ0VTLmV4ZWMoc3RyaW5nKSkpIHtcblxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UobWF0Y2hlc1swXSwgJy0nICsgbWF0Y2hlc1sxXSk7XG5cbiAgICAgICAgICAgIFNQQUNFUy5sYXN0SW5kZXggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaGVzID0gQ0FNRUxTLmV4ZWMoc3RyaW5nKSkpIHtcblxuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UobWF0Y2hlc1swXSwgbWF0Y2hlc1swXVswXSArICctJyArIG1hdGNoZXNbMV0pO1xuXG4gICAgICAgICAgICBDQU1FTFMubGFzdEluZGV4ID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcgPyBzdHJpbmcudG9Mb3dlckNhc2UoKSA6IHN0cmluZztcbn1cbiIsIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgbWFwIGFuIGF0dHJpYnV0ZSB2YWx1ZSB0byBhIHByb3BlcnR5IHZhbHVlXG4gKi9cbmV4cG9ydCB0eXBlIEF0dHJpYnV0ZU1hcHBlciA9ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gYW55O1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIG1hcCBhIHByb3BlcnR5IHZhbHVlIHRvIGFuIGF0dHJpYnV0ZSB2YWx1ZVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eU1hcHBlciA9ICh2YWx1ZTogYW55KSA9PiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIEFuIG9iamVjdCB0aGF0IGhvbGRzIGFuIHtAbGluayBBdHRyaWJ1dGVNYXBwZXJ9IGFuZCBhIHtAbGluayBQcm9wZXJ0eU1hcHBlcn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBdHRyaWJ1dGVDb252ZXJ0ZXIge1xuICAgIHRvQXR0cmlidXRlOiBQcm9wZXJ0eU1hcHBlcjtcbiAgICBmcm9tQXR0cmlidXRlOiBBdHRyaWJ1dGVNYXBwZXI7XG59XG5cbi8qKlxuICogQGludGVybmFsXG4gKiBAcHJpdmF0ZVxuICovXG50eXBlIEF0dHJpYnV0ZUNvbnZlcnRlclR5cGVzID0gJ2RlZmF1bHQnIHwgJ2Jvb2xlYW4nIHwgJ3N0cmluZycgfCAnbnVtYmVyJyB8ICdvYmplY3QnIHwgJ2FycmF5JyB8ICdkYXRlJztcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqIEBwcml2YXRlXG4gKi9cbnR5cGUgQXR0cmlidXRlQ29udmVydGVyTWFwID0geyBbUCBpbiBBdHRyaWJ1dGVDb252ZXJ0ZXJUeXBlc106IEF0dHJpYnV0ZUNvbnZlcnRlcjsgfVxuXG4vKipcbiAqIEEgbWFwIG9mIHJldXNhYmxlIHtAbGluayBBdHRyaWJ1dGVDb252ZXJ0ZXJ9c1xuICpcbiAqIEByZW1hcmtcbiAqIEZvciB0aGUgbW9zdCBjb21tb24gdHlwZXMsIGEgY29udmVydGVyIGV4aXN0cyB3aGljaCBjYW4gYmUgcmVmZXJlbmNlZCBpbiB0aGUge0BsaW5rIFByb3BlcnR5RGVjbGFyYXRpb259LlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IEN1c3RvbUVsZW1lbnQsIHByb3BlcnR5LCBBVFRSSUJVVEVfQ09OVkVSVEVSUyB9IGZyb20gJ2N1c3RvbS1lbGVtZW50JztcbiAqXG4gKiBleHBvcnQgY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gKlxuICogICAgICBAcHJvcGVydHkoe1xuICogICAgICAgICAgY29udmVydGVyOiBBVFRSSUJVVEVfQ09OVkVSVEVSUy5ib29sZWFuXG4gKiAgICAgIH0pXG4gKiAgICAgIG15UHJvcGVydHkgPSB0cnVlO1xuICogfVxuICogYGBgXG4gKlxuICogVE9ETzogV3JpdGUgdGVzdHMgZm9yIHRoaXNcbiAqL1xuZXhwb3J0IGNvbnN0IEFUVFJJQlVURV9DT05WRVJURVJTOiBBdHRyaWJ1dGVDb252ZXJ0ZXJNYXAgPSB7XG4gICAgZGVmYXVsdDoge1xuICAgICAgICBmcm9tQXR0cmlidXRlOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgICAgICAgIC8vIGBKU09OLnBhcnNlKClgIHdpbGwgdGhyb3cgYW4gZXJyb3IgZm9yIGVtcHR5IHN0cmluZ3MgLSB3ZSBjb25zaWRlciBpdCBudWxsXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYEpTT04ucGFyc2UoKWAgd2lsbCBzdWNjZXNzZnVsbHkgcGFyc2UgYGJvb2xlYW5gLCBgbnVtYmVyYCBhbmQgYEpTT04uc3RyaW5naWZ5YCdkIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBpdCB0aHJvd3MsIGl0IG1lYW5zIHdlJ3JlIHByb2JhYmx5IGRlYWxpbmcgd2l0aCBhIHJlZ3VsYXIgc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICAgICAgc3dpdGNoICh0eXBlb2YgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdib29sZWFuJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlID8gJycgOiBudWxsO1xuICAgICAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUgPT0gbnVsbCkgPyB2YWx1ZSA6IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IC8vIG51bWJlciwgYmlnaW50LCBzeW1ib2wsIGZ1bmN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBib29sZWFuOiB7XG4gICAgICAgIGZyb21BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gKHZhbHVlICE9PSBudWxsKSxcbiAgICAgICAgdG9BdHRyaWJ1dGU6ICh2YWx1ZTogYm9vbGVhbikgPT4gdmFsdWUgPyAnJyA6IG51bGxcbiAgICB9LFxuICAgIHN0cmluZzoge1xuICAgICAgICBmcm9tQXR0cmlidXRlOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+ICh2YWx1ZSA9PT0gbnVsbCkgPyBudWxsIDogdmFsdWUsXG4gICAgICAgIC8vIHBhc3MgdGhyb3VnaCBudWxsIG9yIHVuZGVmaW5lZFxuICAgICAgICB0b0F0dHJpYnV0ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZhbHVlXG4gICAgfSxcbiAgICBudW1iZXI6IHtcbiAgICAgICAgZnJvbUF0dHJpYnV0ZTogKHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiAodmFsdWUgPT09IG51bGwpID8gbnVsbCA6IE51bWJlcih2YWx1ZSksXG4gICAgICAgIC8vIHBhc3MgdGhyb3VnaCBudWxsIG9yIHVuZGVmaW5lZCB1c2luZyBgdmFsdWUgPT0gbnVsbGBcbiAgICAgICAgdG9BdHRyaWJ1dGU6ICh2YWx1ZTogbnVtYmVyKSA9PiAodmFsdWUgPT0gbnVsbCkgPyB2YWx1ZSA6IHZhbHVlLnRvU3RyaW5nKClcbiAgICB9LFxuICAgIG9iamVjdDoge1xuICAgICAgICAvLyBgSlNPTi5wYXJzZSgpYCB3aWxsIHRocm93IGFuIGVycm9yIGZvciBlbXB0eSBzdHJpbmdzIC0gd2UgY29uc2lkZXIgaXQgbnVsbFxuICAgICAgICBmcm9tQXR0cmlidXRlOiAodmFsdWU6IHN0cmluZyB8IG51bGwpID0+ICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycpID8gbnVsbCA6IEpTT04ucGFyc2UodmFsdWUpLFxuICAgICAgICAvLyBwYXNzIHRocm91Z2ggbnVsbCBvciB1bmRlZmluZWQgdXNpbmcgYHZhbHVlID09IG51bGxgXG4gICAgICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IG9iamVjdCkgPT4gKHZhbHVlID09IG51bGwpID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcbiAgICB9LFxuICAgIGFycmF5OiB7XG4gICAgICAgIC8vIGBKU09OLnBhcnNlKClgIHdpbGwgdGhyb3cgYW4gZXJyb3IgZm9yIGVtcHR5IHN0cmluZ3MgLSB3ZSBjb25zaWRlciBpdCBudWxsXG4gICAgICAgIGZyb21BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykgPyBudWxsIDogSlNPTi5wYXJzZSh2YWx1ZSksXG4gICAgICAgIC8vIHBhc3MgdGhyb3VnaCBudWxsIG9yIHVuZGVmaW5lZCB1c2luZyBgdmFsdWUgPT0gbnVsbGBcbiAgICAgICAgdG9BdHRyaWJ1dGU6ICh2YWx1ZTogb2JqZWN0KSA9PiAodmFsdWUgPT0gbnVsbCkgPyB2YWx1ZSA6IEpTT04uc3RyaW5naWZ5KHZhbHVlKVxuICAgIH0sXG4gICAgZGF0ZToge1xuICAgICAgICAvLyBgbmV3IERhdGUoKWAgd2lsbCByZXR1cm4gYW4gYEludmFsaWQgRGF0ZWAgZm9yIGVtcHR5IHN0cmluZ3MgLSB3ZSBjb25zaWRlciBpdCBudWxsXG4gICAgICAgIGZyb21BdHRyaWJ1dGU6ICh2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4gKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSAnJykgPyBudWxsIDogbmV3IERhdGUodmFsdWUpLFxuICAgICAgICAvLyBwYXNzIHRocm91Z2ggbnVsbCBvciB1bmRlZmluZWQgdXNpbmcgYHZhbHVlID09IG51bGxgXG4gICAgICAgIHRvQXR0cmlidXRlOiAodmFsdWU6IERhdGUpID0+ICh2YWx1ZSA9PSBudWxsKSA/IHZhbHVlIDogdmFsdWUudG9TdHJpbmcoKVxuICAgIH1cbn07XG4iLCJpbXBvcnQgeyBDdXN0b21FbGVtZW50IH0gZnJvbSAnLi4vY3VzdG9tLWVsZW1lbnQnO1xuaW1wb3J0IHsga2ViYWJDYXNlIH0gZnJvbSAnLi4vdXRpbHMvc3RyaW5nLXV0aWxzJztcbmltcG9ydCB7IEF0dHJpYnV0ZUNvbnZlcnRlciwgQVRUUklCVVRFX0NPTlZFUlRFUlMgfSBmcm9tICcuL2F0dHJpYnV0ZS1jb252ZXJ0ZXInO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlZmxlY3QgYW4gYXR0cmlidXRlIHZhbHVlIHRvIGEgcHJvcGVydHlcbiAqL1xuZXhwb3J0IHR5cGUgQXR0cmlidXRlUmVmbGVjdG9yPFR5cGUgZXh0ZW5kcyBDdXN0b21FbGVtZW50ID0gQ3VzdG9tRWxlbWVudD4gPSAodGhpczogVHlwZSwgYXR0cmlidXRlTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIHJlZmxlY3QgYSBwcm9wZXJ0eSB2YWx1ZSB0byBhbiBhdHRyaWJ1dGVcbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlSZWZsZWN0b3I8VHlwZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQgPSBDdXN0b21FbGVtZW50PiA9ICh0aGlzOiBUeXBlLCBwcm9wZXJ0eUtleTogUHJvcGVydHlLZXksIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpID0+IHZvaWQ7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgZGlzcGF0Y2ggYSBjdXN0b20gZXZlbnQgZm9yIGEgcHJvcGVydHkgY2hhbmdlXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5Tm90aWZpZXI8VHlwZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQgPSBDdXN0b21FbGVtZW50PiA9ICh0aGlzOiBUeXBlLCBwcm9wZXJ0eUtleTogUHJvcGVydHlLZXksIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpID0+IHZvaWQ7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgcmV0dXJuIGB0cnVlYCBpZiB0aGUgYG9sZFZhbHVlYCBhbmQgdGhlIGBuZXdWYWx1ZWAgb2YgYSBwcm9wZXJ0eSBhcmUgZGlmZmVyZW50LCBgZmFsc2VgIG90aGVyd2lzZVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUNoYW5nZURldGVjdG9yID0gKG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpID0+IGJvb2xlYW47XG5cbi8qKlxuICogQSB0eXBlIGd1YXJkIGZvciB7QGxpbmsgQXR0cmlidXRlUmVmbGVjdG9yfVxuICpcbiAqIEBwYXJhbSByZWZsZWN0b3IgQSByZWZsZWN0b3IgdG8gdGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBdHRyaWJ1dGVSZWZsZWN0b3IgKHJlZmxlY3RvcjogYW55KTogcmVmbGVjdG9yIGlzIEF0dHJpYnV0ZVJlZmxlY3RvciB7XG5cbiAgICByZXR1cm4gdHlwZW9mIHJlZmxlY3RvciA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyoqXG4gKiBBIHR5cGUgZ3VhcmQgZm9yIHtAbGluayBQcm9wZXJ0eVJlZmxlY3Rvcn1cbiAqXG4gKiBAcGFyYW0gcmVmbGVjdG9yIEEgcmVmbGVjdG9yIHRvIHRlc3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcGVydHlSZWZsZWN0b3IgKHJlZmxlY3RvcjogYW55KTogcmVmbGVjdG9yIGlzIFByb3BlcnR5UmVmbGVjdG9yIHtcblxuICAgIHJldHVybiB0eXBlb2YgcmVmbGVjdG9yID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIEEgdHlwZSBndWFyZCBmb3Ige0BsaW5rIFByb3BlcnR5Tm90aWZpZXJ9XG4gKlxuICogQHBhcmFtIG5vdGlmaWVyIEEgbm90aWZpZXIgdG8gdGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9wZXJ0eU5vdGlmaWVyIChub3RpZmllcjogYW55KTogbm90aWZpZXIgaXMgUHJvcGVydHlOb3RpZmllciB7XG5cbiAgICByZXR1cm4gdHlwZW9mIG5vdGlmaWVyID09PSAnZnVuY3Rpb24nO1xufVxuXG4vKipcbiAqIEEgdHlwZSBndWFyZCBmb3Ige0BsaW5rIFByb3BlcnR5S2V5fVxuICpcbiAqIEBwYXJhbSBrZXkgQSBwcm9wZXJ0eSBrZXkgdG8gdGVzdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9wZXJ0eUtleSAoa2V5OiBhbnkpOiBrZXkgaXMgUHJvcGVydHlLZXkge1xuXG4gICAgcmV0dXJuIHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBrZXkgPT09ICdudW1iZXInIHx8IHR5cGVvZiBrZXkgPT09ICdzeW1ib2wnO1xufVxuXG4vKipcbiAqIEVuY29kZXMgYSBzdHJpbmcgZm9yIHVzZSBhcyBodG1sIGF0dHJpYnV0ZSByZW1vdmluZyBpbnZhbGlkIGF0dHJpYnV0ZSBjaGFyYWN0ZXJzXG4gKlxuICogQHBhcmFtIHZhbHVlIEEgc3RyaW5nIHRvIGVuY29kZSBmb3IgdXNlIGFzIGh0bWwgYXR0cmlidXRlXG4gKiBAcmV0dXJucyAgICAgQW4gZW5jb2RlZCBzdHJpbmcgdXNhYmxlIGFzIGh0bWwgYXR0cmlidXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVBdHRyaWJ1dGUgKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gICAgcmV0dXJuIGtlYmFiQ2FzZSh2YWx1ZS5yZXBsYWNlKC9cXFcrL2csICctJykucmVwbGFjZSgvXFwtJC8sICcnKSk7XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGF0dHJpYnV0ZSBuYW1lIGZyb20gYSBwcm9wZXJ0eSBrZXlcbiAqXG4gKiBAcmVtYXJrc1xuICogTnVtZXJpYyBwcm9wZXJ0eSBpbmRleGVzIG9yIHN5bWJvbHMgY2FuIGNvbnRhaW4gaW52YWxpZCBjaGFyYWN0ZXJzIGZvciBhdHRyaWJ1dGUgbmFtZXMuIFRoaXMgbWV0aG9kXG4gKiBzYW5pdGl6ZXMgdGhvc2UgY2hhcmFjdGVycyBhbmQgcmVwbGFjZXMgc2VxdWVuY2VzIG9mIGludmFsaWQgY2hhcmFjdGVycyB3aXRoIGEgZGFzaC5cbiAqIEF0dHJpYnV0ZSBuYW1lcyBhcmUgbm90IGFsbG93ZWQgdG8gc3RhcnQgd2l0aCBudW1iZXJzIGVpdGhlciBhbmQgYXJlIHByZWZpeGVkIHdpdGggJ2F0dHItJy5cbiAqXG4gKiBOLkIuOiBXaGVuIHVzaW5nIGN1c3RvbSBzeW1ib2xzIGFzIHByb3BlcnR5IGtleXMsIHVzZSB1bmlxdWUgZGVzY3JpcHRpb25zIGZvciB0aGUgc3ltYm9scyB0byBhdm9pZFxuICogY2xhc2hpbmcgYXR0cmlidXRlIG5hbWVzLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGEgPSBTeW1ib2woKTtcbiAqIGNvbnN0IGIgPSBTeW1ib2woKTtcbiAqXG4gKiBhICE9PSBiOyAvLyB0cnVlXG4gKlxuICogY3JlYXRlQXR0cmlidXRlTmFtZShhKSAhPT0gY3JlYXRlQXR0cmlidXRlTmFtZShiKTsgLy8gZmFsc2UgLS0+ICdhdHRyLXN5bWJvbCcgPT09ICdhdHRyLXN5bWJvbCdcbiAqXG4gKiBjb25zdCBjID0gU3ltYm9sKCdjJyk7XG4gKiBjb25zdCBkID0gU3ltYm9sKCdkJyk7XG4gKlxuICogYyAhPT0gZDsgLy8gdHJ1ZVxuICpcbiAqIGNyZWF0ZUF0dHJpYnV0ZU5hbWUoYykgIT09IGNyZWF0ZUF0dHJpYnV0ZU5hbWUoZCk7IC8vIHRydWUgLS0+ICdhdHRyLXN5bWJvbC1jJyA9PT0gJ2F0dHItc3ltYm9sLWQnXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gcHJvcGVydHlLZXkgICBBIHByb3BlcnR5IGtleSB0byBjb252ZXJ0IHRvIGFuIGF0dHJpYnV0ZSBuYW1lXG4gKiBAcmV0dXJucyAgICAgICAgICAgICBUaGUgZ2VuZXJhdGVkIGF0dHJpYnV0ZSBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBdHRyaWJ1dGVOYW1lIChwcm9wZXJ0eUtleTogUHJvcGVydHlLZXkpOiBzdHJpbmcge1xuXG4gICAgaWYgKHR5cGVvZiBwcm9wZXJ0eUtleSA9PT0gJ3N0cmluZycpIHtcblxuICAgICAgICByZXR1cm4ga2ViYWJDYXNlKHByb3BlcnR5S2V5KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gVE9ETzogdGhpcyBjb3VsZCBjcmVhdGUgbXVsdGlwbGUgaWRlbnRpY2FsIGF0dHJpYnV0ZSBuYW1lcywgaWYgc3ltYm9scyBkb24ndCBoYXZlIHVuaXF1ZSBkZXNjcmlwdGlvblxuICAgICAgICByZXR1cm4gYGF0dHItJHtlbmNvZGVBdHRyaWJ1dGUoU3RyaW5nKHByb3BlcnR5S2V5KSl9YDtcbiAgICB9XG59XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGV2ZW50IG5hbWUgZnJvbSBhIHByb3BlcnR5IGtleVxuICpcbiAqIEByZW1hcmtzXG4gKiBFdmVudCBuYW1lcyBkb24ndCBoYXZlIHRoZSBzYW1lIHJlc3RyaWN0aW9ucyBhcyBhdHRyaWJ1dGUgbmFtZXMgd2hlbiBpdCBjb21lcyB0byBpbnZhbGlkXG4gKiBjaGFyYWN0ZXJzLiBIb3dldmVyLCBmb3IgY29uc2lzdGVuY2llcyBzYWtlLCB3ZSBhcHBseSB0aGUgc2FtZSBydWxlcyBmb3IgZXZlbnQgbmFtZXMgYXNcbiAqIGZvciBhdHRyaWJ1dGUgbmFtZXMuXG4gKlxuICogQHBhcmFtIHByb3BlcnR5S2V5ICAgQSBwcm9wZXJ0eSBrZXkgdG8gY29udmVydCB0byBhbiBhdHRyaWJ1dGUgbmFtZVxuICogQHBhcmFtIHByZWZpeCAgICAgICAgQW4gb3B0aW9uYWwgcHJlZml4LCBlLmcuOiAnb24nXG4gKiBAcGFyYW0gc3VmZml4ICAgICAgICBBbiBvcHRpb25hbCBzdWZmaXgsIGUuZy46ICdjaGFuZ2VkJ1xuICogQHJldHVybnMgICAgICAgICAgICAgVGhlIGdlbmVyYXRlZCBldmVudCBuYW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFdmVudE5hbWUgKHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSwgcHJlZml4Pzogc3RyaW5nLCBzdWZmaXg/OiBzdHJpbmcpOiBzdHJpbmcge1xuXG4gICAgbGV0IHByb3BlcnR5U3RyaW5nID0gJyc7XG5cbiAgICBpZiAodHlwZW9mIHByb3BlcnR5S2V5ID09PSAnc3RyaW5nJykge1xuXG4gICAgICAgIHByb3BlcnR5U3RyaW5nID0ga2ViYWJDYXNlKHByb3BlcnR5S2V5KTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgLy8gVE9ETzogdGhpcyBjb3VsZCBjcmVhdGUgbXVsdGlwbGUgaWRlbnRpY2FsIGV2ZW50IG5hbWVzLCBpZiBzeW1ib2xzIGRvbid0IGhhdmUgdW5pcXVlIGRlc2NyaXB0aW9uXG4gICAgICAgIHByb3BlcnR5U3RyaW5nID0gZW5jb2RlQXR0cmlidXRlKFN0cmluZyhwcm9wZXJ0eUtleSkpO1xuICAgIH1cblxuICAgIHJldHVybiBgJHsgcHJlZml4ID8gYCR7IGtlYmFiQ2FzZShwcmVmaXgpIH0tYCA6ICcnIH0keyBwcm9wZXJ0eVN0cmluZyB9JHsgc3VmZml4ID8gYC0keyBrZWJhYkNhc2Uoc3VmZml4KSB9YCA6ICcnIH1gO1xufVxuXG4vKipcbiAqIEEge0BsaW5rIEN1c3RvbUVsZW1lbnR9IHByb3BlcnR5IGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydHlEZWNsYXJhdGlvbjxUeXBlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCA9IEN1c3RvbUVsZW1lbnQ+IHtcbiAgICAvKipcbiAgICAgKiBEb2VzIHByb3BlcnR5IGhhdmUgYW4gYXNzb2NpYXRlZCBhdHRyaWJ1dGU/XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBvc3NpYmxlIHZhbHVlczpcbiAgICAgKiAqIGBmYWxzZWA6IE5vIGF0dHJpYnV0ZSB3aWxsIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHByb3BlcnR5XG4gICAgICogKiBgdHJ1ZWA6IFRoZSBhdHRyaWJ1dGUgbmFtZSB3aWxsIGJlIGluZmVycmVkIGJ5IGNhbWVsLWNhc2luZyB0aGUgcHJvcGVydHkgbmFtZVxuICAgICAqICogYHN0cmluZ2A6IFVzZSB0aGUgcHJvdmlkZWQgc3RyaW5nIGFzIHRoZSBhc3NvY2lhdGVkIGF0dHJpYnV0ZSBuYW1lXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgdHJ1ZWBcbiAgICAgKi9cbiAgICBhdHRyaWJ1dGU6IGJvb2xlYW4gfCBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBDdXN0b21pemUgdGhlIGNvbnZlcnNpb24gb2YgdmFsdWVzIGJldHdlZW4gcHJvcGVydHkgYW5kIGFzc29jaWF0ZWQgYXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIENvbnZlcnRlcnMgYXJlIG9ubHkgdXNlZCB3aGVuIHtAbGluayByZWZsZWN0UHJvcGVydHl9IGFuZC9vciB7QGxpbmsgcmVmbGVjdEF0dHJpYnV0ZX0gYXJlIHNldCB0byB0cnVlLlxuICAgICAqIElmIGN1c3RvbSByZWZsZWN0b3JzIGFyZSB1c2VkLCB0aGV5IGhhdmUgdG8gdGFrZSBjYXJlIG9yIGNvbnZlcnRpbmcgdGhlIHByb3BlcnR5L2F0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgQVRUUklCVVRFX0NPTlZFUlRFUlMuZGVmYXVsdGBcbiAgICAgKi9cbiAgICBjb252ZXJ0ZXI6IEF0dHJpYnV0ZUNvbnZlcnRlcjtcblxuICAgIC8qKlxuICAgICAqIFNob3VsZCB0aGUgYXNzb2NpYXRlZCBhdHRyaWJ1dGUncyB2YWx1ZSBiZSBhdXRvbWF0aWNhbGx5IHJlZmxlY3RlZCB0byB0aGUgcHJvcGVydHk/XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFBvc3NpYmxlIHZhbHVlczpcbiAgICAgKiAqIGBmYWxzZWA6IFRoZSBhdHRyaWJ1dGUgdmFsdWUgd2lsbCBub3QgYmUgcmVmbGVjdGVkIHRvIHRoZSBwcm9wZXJ0eSBhdXRvbWF0aWNhbGx5XG4gICAgICogKiBgdHJ1ZWA6IEFueSBhdHRyaWJ1dGUgY2hhbmdlIHdpbGwgYmUgcmVmbGVjdGVkIGF1dG9tYXRpY2FsbHkgdG8gdGhlIHByb3BlcnR5IHVzaW5nIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZSByZWZsZWN0b3JcbiAgICAgKiAqIGBQcm9wZXJ0eUtleWA6IEEgbWV0aG9kIG9uIHRoZSBjdXN0b20gZWxlbWVudCB3aXRoIHRoYXQgcHJvcGVydHkga2V5IHdpbGwgYmUgaW52b2tlZCB0byBoYW5kbGUgdGhlIGF0dHJpYnV0ZSByZWZsZWN0aW9uXG4gICAgICogKiBgRnVuY3Rpb25gOiBUaGUgcHJvdmlkZWQgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIHdpdGggaXRzIGB0aGlzYCBjb250ZXh0IGJvdW5kIHRvIHRoZSBjdXN0b20gZWxlbWVudCBpbnN0YW5jZVxuICAgICAqXG4gICAgICogRGVmYXVsdCB2YWx1ZTogYHRydWVgXG4gICAgICovXG4gICAgcmVmbGVjdEF0dHJpYnV0ZTogYm9vbGVhbiB8IGtleW9mIFR5cGUgfCBBdHRyaWJ1dGVSZWZsZWN0b3I8VHlwZT47XG5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgdGhlIHByb3BlcnR5IHZhbHVlIGJlIGF1dG9tYXRpY2FsbHkgcmVmbGVjdGVkIHRvIHRoZSBhc3NvY2lhdGVkIGF0dHJpYnV0ZT9cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUG9zc2libGUgdmFsdWVzOlxuICAgICAqICogYGZhbHNlYDogVGhlIHByb3BlcnR5IHZhbHVlIHdpbGwgbm90IGJlIHJlZmxlY3RlZCB0byB0aGUgYXNzb2NpYXRlZCBhdHRyaWJ1dGUgYXV0b21hdGljYWxseVxuICAgICAqICogYHRydWVgOiBBbnkgcHJvcGVydHkgY2hhbmdlIHdpbGwgYmUgcmVmbGVjdGVkIGF1dG9tYXRpY2FsbHkgdG8gdGhlIGFzc29jaWF0ZWQgYXR0cmlidXRlIHVzaW5nIHRoZSBkZWZhdWx0IHByb3BlcnR5IHJlZmxlY3RvclxuICAgICAqICogYFByb3BlcnR5S2V5YDogQSBtZXRob2Qgb24gdGhlIGN1c3RvbSBlbGVtZW50IHdpdGggdGhhdCBwcm9wZXJ0eSBrZXkgd2lsbCBiZSBpbnZva2VkIHRvIGhhbmRsZSB0aGUgcHJvcGVydHkgcmVmbGVjdGlvblxuICAgICAqICogYEZ1bmN0aW9uYDogVGhlIHByb3ZpZGVkIGZ1bmN0aW9uIHdpbGwgYmUgaW52b2tlZCB3aXRoIGl0cyBgdGhpc2AgY29udGV4dCBib3VuZCB0byB0aGUgY3VzdG9tIGVsZW1lbnQgaW5zdGFuY2VcbiAgICAgKlxuICAgICAqIERlZmF1bHQgdmFsdWU6IGB0cnVlYFxuICAgICAqL1xuICAgIHJlZmxlY3RQcm9wZXJ0eTogYm9vbGVhbiB8IGtleW9mIFR5cGUgfCBQcm9wZXJ0eVJlZmxlY3RvcjxUeXBlPjtcblxuICAgIC8qKlxuICAgICAqIFNob3VsZCBhIHByb3BlcnR5IHZhbHVlIGNoYW5nZSByYWlzZSBhIGN1c3RvbSBldmVudD9cbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogUG9zc2libGUgdmFsdWVzOlxuICAgICAqICogYGZhbHNlYDogRG9uJ3QgY3JlYXRlIGEgY3VzdG9tIGV2ZW50IGZvciB0aGlzIHByb3BlcnR5XG4gICAgICogKiBgdHJ1ZWA6IENyZWF0ZSBjdXN0b20gZXZlbnRzIGZvciB0aGlzIHByb3BlcnR5IGF1dG9tYXRpY2FsbHlcbiAgICAgKiAqIGBQcm9wZXJ0eUtleWA6IFVzZSB0aGUgbWV0aG9kIHdpdGggdGhpcyBwcm9wZXJ0eSBrZXkgb24gdGhlIGN1c3RvbSBlbGVtZW50IHRvIGNyZWF0ZSBjdXN0b20gZXZlbnRzXG4gICAgICogKiBgRnVuY3Rpb25gOiBVc2UgdGhlIHRoZSBwcm92aWRlZCBmdW5jdGlvbiB0byBjcmVhdGUgY3VzdG9tIGV2ZW50cyAoYHRoaXNgIGNvbnRleHQgd2lsbCBiZSB0aGUgY3VzdG9tIGVsZW1lbnQgaW5zdGFuY2UpXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgdHJ1ZWBcbiAgICAgKi9cbiAgICBub3RpZnk6IGJvb2xlYW4gfCBrZXlvZiBUeXBlIHwgUHJvcGVydHlOb3RpZmllcjxUeXBlPjtcblxuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyZSBob3cgY2hhbmdlcyBvZiB0aGlzIHByb3BlcnR5IHNob3VsZCBiZSBtb25pdG9yZWRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogQnkgZGVmYXVsdCBhIGRlY29yYXRlZCBwcm9wZXJ0eSB3aWxsIGJlIG9ic2VydmVkIGZvciBjaGFuZ2VzICh0aHJvdWdoIGEgY3VzdG9tIHNldHRlciBmb3IgdGhlIHByb3BlcnR5KS5cbiAgICAgKiBBbnkgYHNldGAtb3BlcmF0aW9uIG9mIHRoaXMgcHJvcGVydHkgd2lsbCB0aGVyZWZvcmUgcmVxdWVzdCBhbiB1cGRhdGUgb2YgdGhlIGN1c3RvbSBlbGVtZW50IGFuZCBpbml0aWF0ZVxuICAgICAqIGEgcmVuZGVyIGFzIHdlbGwgYXMgcmVmbGVjdGlvbiBhbmQgbm90aWZpY2F0aW9uLlxuICAgICAqXG4gICAgICogUG9zc2libGUgdmFsdWVzOlxuICAgICAqICogYGZhbHNlYDogRG9uJ3Qgb2JzZXJ2ZSBjaGFuZ2VzIG9mIHRoaXMgcHJvcGVydHkgKHRoaXMgd2lsbCBieXBhc3MgcmVuZGVyLCByZWZsZWN0aW9uIGFuZCBub3RpZmljYXRpb24pXG4gICAgICogKiBgdHJ1ZWA6IE9ic2VydmUgY2hhbmdlcyBvZiB0aGlzIHByb3BlcnR5IHVzaW5nIHRoZSB7QGxpbmsgREVGQVVMVF9QUk9QRVJUWV9DSEFOR0VfREVURUNUT1J9XG4gICAgICogKiBgUHJvcGVydHlLZXlgOiBVc2UgYSBtZXRob2Qgd2l0aCB0aGlzIHByb3BlcnR5IGtleSBvbiB0aGUgY3VzdG9tIGVsZW1lbnQgdG8gY2hlY2sgaWYgcHJvcGVydHkgdmFsdWUgaGFzIGNoYW5nZWRcbiAgICAgKiAqIGBGdW5jdGlvbmA6IFVzZSB0aGUgcHJvdmlkZWQgbWV0aG9kIHRvIGNoZWNrIGlmIHByb3BlcnR5IHZhbHVlIGhhcyBjaGFuZ2VkIChgdGhpc2AgY29udGV4dCB3aWxsIGJlIGN1c3RvbSBlbGVtZW50IGluc3RhbmNlKVxuICAgICAqXG4gICAgICogRGVmYXVsdCB2YWx1ZTogYHRydWVgICh1c2VzIHtAbGluayBERUZBVUxUX1BST1BFUlRZX0NIQU5HRV9ERVRFQ1RPUn0gaW50ZXJuYWxseSlcbiAgICAgKi9cbiAgICBvYnNlcnZlOiBib29sZWFuIHwga2V5b2YgVHlwZSB8IFByb3BlcnR5Q2hhbmdlRGV0ZWN0b3I7XG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgcHJvcGVydHkgY2hhbmdlIGRldGVjdG9yXG4gKlxuICogQHBhcmFtIG9sZFZhbHVlICBUaGUgb2xkIHByb3BlcnR5IHZhbHVlXG4gKiBAcGFyYW0gbmV3VmFsdWUgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAqIEByZXR1cm5zICAgICAgICAgQSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIHByb3BlcnR5IHZhbHVlIGNoYW5nZWRcbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfUFJPUEVSVFlfQ0hBTkdFX0RFVEVDVE9SOiBQcm9wZXJ0eUNoYW5nZURldGVjdG9yID0gKG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpID0+IHtcbiAgICAvLyBpbiBjYXNlIGBvbGRWYWx1ZWAgYW5kIGBuZXdWYWx1ZWAgYXJlIGBOYU5gLCBgKE5hTiAhPT0gTmFOKWAgcmV0dXJucyBgdHJ1ZWAsXG4gICAgLy8gYnV0IGAoTmFOID09PSBOYU4gfHwgTmFOID09PSBOYU4pYCByZXR1cm5zIGBmYWxzZWBcbiAgICByZXR1cm4gb2xkVmFsdWUgIT09IG5ld1ZhbHVlICYmIChvbGRWYWx1ZSA9PT0gb2xkVmFsdWUgfHwgbmV3VmFsdWUgPT09IG5ld1ZhbHVlKTtcbn07XG5cbi8qKlxuICogVGhlIGRlZmF1bHQge0BsaW5rIEN1c3RvbUVsZW1lbnR9IHByb3BlcnR5IGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX1BST1BFUlRZX0RFQ0xBUkFUSU9OOiBQcm9wZXJ0eURlY2xhcmF0aW9uID0ge1xuICAgIGF0dHJpYnV0ZTogdHJ1ZSxcbiAgICBjb252ZXJ0ZXI6IEFUVFJJQlVURV9DT05WRVJURVJTLmRlZmF1bHQsXG4gICAgcmVmbGVjdEF0dHJpYnV0ZTogdHJ1ZSxcbiAgICByZWZsZWN0UHJvcGVydHk6IHRydWUsXG4gICAgbm90aWZ5OiB0cnVlLFxuICAgIG9ic2VydmU6IERFRkFVTFRfUFJPUEVSVFlfQ0hBTkdFX0RFVEVDVE9SLFxufTtcbiIsImltcG9ydCB7IGh0bWwsIHJlbmRlciwgVGVtcGxhdGVSZXN1bHQgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgeyBMaXN0ZW5lckRlY2xhcmF0aW9uIH0gZnJvbSAnLi9kZWNvcmF0b3JzL2xpc3RlbmVyJztcbmltcG9ydCB7IEF0dHJpYnV0ZVJlZmxlY3RvciwgY3JlYXRlRXZlbnROYW1lLCBpc0F0dHJpYnV0ZVJlZmxlY3RvciwgaXNQcm9wZXJ0eUtleSwgaXNQcm9wZXJ0eU5vdGlmaWVyLCBpc1Byb3BlcnR5UmVmbGVjdG9yLCBQcm9wZXJ0eURlY2xhcmF0aW9uLCBQcm9wZXJ0eU5vdGlmaWVyLCBQcm9wZXJ0eVJlZmxlY3RvciB9IGZyb20gXCIuL2RlY29yYXRvcnMvcHJvcGVydHktZGVjbGFyYXRpb25cIjtcblxuY29uc3QgQVRUUklCVVRFX1JFRkxFQ1RPUl9FUlJPUiA9IChhdHRyaWJ1dGVSZWZsZWN0b3I6IFByb3BlcnR5S2V5IHwgRnVuY3Rpb24pID0+IG5ldyBFcnJvcihgRXJyb3IgZXhlY3V0aW5nIGF0dHJpYnV0ZSByZWZsZWN0b3IgJHsgU3RyaW5nKGF0dHJpYnV0ZVJlZmxlY3RvcikgfS5gKTtcbmNvbnN0IFBST1BFUlRZX1JFRkxFQ1RPUl9FUlJPUiA9IChwcm9wZXJ0eVJlZmxlY3RvcjogUHJvcGVydHlLZXkgfCBGdW5jdGlvbikgPT4gbmV3IEVycm9yKGBFcnJvciBleGVjdXRpbmcgcHJvcGVydHkgcmVmbGVjdG9yICR7IFN0cmluZyhwcm9wZXJ0eVJlZmxlY3RvcikgfS5gKTtcbmNvbnN0IFBST1BFUlRZX05PVElGSUVSX0VSUk9SID0gKHByb3BlcnR5Tm90aWZpZXI6IFByb3BlcnR5S2V5IHwgRnVuY3Rpb24pID0+IG5ldyBFcnJvcihgRXJyb3IgZXhlY3V0aW5nIHByb3BlcnR5IG5vdGlmaWVyICR7IFN0cmluZyhwcm9wZXJ0eU5vdGlmaWVyKSB9LmApO1xuXG4vKipcbiAqIEV4dGVuZHMgdGhlIHN0YXRpYyB7QGxpbmsgTGlzdGVuZXJEZWNsYXJhdGlvbn0gdG8gaW5jbHVkZSB0aGUgYm91bmQgbGlzdGVuZXJcbiAqIGZvciBhIGN1c3RvbSBlbGVtZW50IGluc3RhbmNlLlxuICovXG5pbnRlcmZhY2UgSW5zdGFuY2VMaXN0ZW5lckRlY2xhcmF0aW9uIGV4dGVuZHMgTGlzdGVuZXJEZWNsYXJhdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgYm91bmQgbGlzdGVuZXIgd2lsbCBiZSBzdG9yZWQgaGVyZSwgc28gaXQgY2FuIGJlIHJlbW92ZWQgaXQgbGF0ZXJcbiAgICAgKi9cbiAgICBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lcjtcblxuICAgIC8qKlxuICAgICAqIFRoZSBldmVudCB0YXJnZXQgd2lsbCBhbHdheXMgYmUgcmVzb2x2ZWQgdG8gYW4gYWN0dWFsIHtAbGluayBFdmVudFRhcmdldH1cbiAgICAgKi9cbiAgICB0YXJnZXQ6IEV2ZW50VGFyZ2V0O1xufVxuXG4vKipcbiAqIFRoZSBjdXN0b20gZWxlbWVudCBiYXNlIGNsYXNzXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDdXN0b21FbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogVGhlIGN1c3RvbSBlbGVtZW50J3Mgc2VsZWN0b3JcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogV2lsbCBiZSBvdmVycmlkZGVuIGJ5IHRoZSB7QGxpbmsgY3VzdG9tRWxlbWVudH0gZGVjb3JhdG9yJ3Mgc2VsZWN0b3Igb3B0aW9uLCBpZiBwcm92aWRlZC5cbiAgICAgKiBPdGhlcndpc2UgdGhlIGRlY29yYXRvciB3aWxsIHVzZSB0aGlzIHByb3BlcnR5IHRvIGRlZmluZSB0aGUgY3VzdG9tIGVsZW1lbnQuXG4gICAgICovXG4gICAgc3RhdGljIHNlbGVjdG9yOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBVc2UgU2hhZG93IERPTVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBXaWxsIGJlIHNldCBieSB0aGUge0BsaW5rIGN1c3RvbUVsZW1lbnR9IGRlY29yYXRvcidzIHNoYWRvdyBvcHRpb24gKGRlZmF1bHRzIHRvIGB0cnVlYCkuXG4gICAgICovXG4gICAgc3RhdGljIHNoYWRvdzogYm9vbGVhbjtcblxuICAgIC8qKlxuICAgICAqIEEgbWFwIG9mIGF0dHJpYnV0ZSBuYW1lcyBhbmQgdGhlaXIgcmVzcGVjdGl2ZSBwcm9wZXJ0eSBrZXlzXG4gICAgICpcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBhdHRyaWJ1dGVzOiBNYXA8c3RyaW5nLCBQcm9wZXJ0eUtleT4gPSBuZXcgTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIG1hcCBvZiBwcm9wZXJ0eSBrZXlzIGFuZCB0aGVpciByZXNwZWN0aXZlIHByb3BlcnR5IGRlY2xhcmF0aW9uc1xuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJvcGVydGllczogTWFwPFByb3BlcnR5S2V5LCBQcm9wZXJ0eURlY2xhcmF0aW9uPiA9IG5ldyBNYXAoKTtcblxuICAgIC8qKlxuICAgICAqIEEgbWFwIG9mIHByb3BlcnR5IGtleXMgYW5kIHRoZWlyIHJlc3BlY3RpdmUgbGlzdGVuZXIgZGVjbGFyYXRpb25zXG4gICAgICpcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN0YXRpYyBsaXN0ZW5lcnM6IE1hcDxQcm9wZXJ0eUtleSwgTGlzdGVuZXJEZWNsYXJhdGlvbj4gPSBuZXcgTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSB0byBzcGVjaWZ5IGF0dHJpYnV0ZXMgd2hpY2ggc2hvdWxkIGJlIG9ic2VydmVkLCBidXQgZG9uJ3QgaGF2ZSBhbiBhc3NvY2lhdGVkIHByb3BlcnR5XG4gICAgICpcbiAgICAgKiBAcmVtYXJrXG4gICAgICogRm9yIHByb3BlcnRpZXMgd2hpY2ggYXJlIGRlY29yYXRlZCB3aXRoIHRoZSB7QGxpbmsgcHJvcGVydHl9IGRlY29yYXRvciwgYW4gb2JzZXJ2ZWQgYXR0cmlidXRlXG4gICAgICogaXMgYXV0b21hdGljYWxseSBjcmVhdGVkIGFuZCBkb2VzIG5vdCBuZWVkIHRvIGJlIHNwZWNpZmllZCBoZXJlLiBGb3QgYXR0cmlidXRlcyB0aGF0IGRvbid0XG4gICAgICogaGF2ZSBhbiBhc3NvY2lhdGVkIHByb3BlcnR5LCByZXR1cm4gdGhlIGF0dHJpYnV0ZSBuYW1lcyBpbiB0aGlzIGdldHRlci4gQ2hhbmdlcyB0byB0aGVzZVxuICAgICAqIGF0dHJpYnV0ZXMgY2FuIGJlIGhhbmRsZWQgaW4gdGhlIHtAbGluayBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2t9IG1ldGhvZC5cbiAgICAgKlxuICAgICAqIFdoZW4gZXh0ZW5kaW5nIGN1c3RvbSBlbGVtZW50cywgbWFrZSBzdXJlIHRvIHJldHVybiB0aGUgc3VwZXIgY2xhc3MncyBvYnNlcnZlZEF0dHJpYnV0ZXNcbiAgICAgKiBpZiB5b3Ugb3ZlcnJpZGUgdGhpcyBnZXR0ZXIgKGV4Y2VwdCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBpbmhlcml0IG9ic2VydmVkIGF0dHJpYnV0ZXMpOlxuICAgICAqXG4gICAgICogYGBgdHlwZXNjcmlwdFxuICAgICAqIEBjdXN0b21FbGVtZW50KHtcbiAgICAgKiAgICAgIHNlbGVjdG9yOiAnbXktZWxlbWVudCdcbiAgICAgKiB9KVxuICAgICAqIGNsYXNzIE15RWxlbWVudCBleHRlbmRzIE15QmFzZUVsZW1lbnQge1xuICAgICAqXG4gICAgICogICAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcyAoKTogc3RyaW5nW10ge1xuICAgICAqXG4gICAgICogICAgICAgICAgcmV0dXJuIFsuLi5zdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMsICdteS1hZGRpdGlvbmFsLWF0dHJpYnV0ZSddO1xuICAgICAqICAgICAgfVxuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcyAoKTogc3RyaW5nW10ge1xuXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX3JlbmRlclJvb3Q6IEVsZW1lbnQgfCBEb2N1bWVudEZyYWdtZW50O1xuXG4gICAgcHJvdGVjdGVkIF91cGRhdGVSZXF1ZXN0OiBQcm9taXNlPGJvb2xlYW4+ID0gUHJvbWlzZS5yZXNvbHZlKHRydWUpO1xuXG4gICAgcHJvdGVjdGVkIF9jaGFuZ2VkUHJvcGVydGllczogTWFwPFByb3BlcnR5S2V5LCBhbnk+ID0gbmV3IE1hcCgpO1xuXG4gICAgcHJvdGVjdGVkIF9yZWZsZWN0aW5nUHJvcGVydGllczogTWFwPFByb3BlcnR5S2V5LCBhbnk+ID0gbmV3IE1hcCgpO1xuXG4gICAgcHJvdGVjdGVkIF9ub3RpZnlpbmdQcm9wZXJ0aWVzOiBNYXA8UHJvcGVydHlLZXksIGFueT4gPSBuZXcgTWFwKCk7XG5cbiAgICBwcm90ZWN0ZWQgX2xpc3RlbmVyRGVjbGFyYXRpb25zOiBJbnN0YW5jZUxpc3RlbmVyRGVjbGFyYXRpb25bXSA9IFtdO1xuXG4gICAgcHJvdGVjdGVkIF9pc0Nvbm5lY3RlZCA9IGZhbHNlO1xuXG4gICAgcHJvdGVjdGVkIF9oYXNSZXF1ZXN0ZWRVcGRhdGUgPSBmYWxzZTtcblxuICAgIHByb3RlY3RlZCBfaXNSZWZsZWN0aW5nID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgY3VzdG9tIGVsZW1lbnQncyB7QGxpbmsgY29ubmVjdGVkQ2FsbGJhY2t9IHdhcyBleGVjdXRlZC5cbiAgICAgKi9cbiAgICBnZXQgaXNDb25uZWN0ZWQgKCk6IGJvb2xlYW4ge1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9pc0Nvbm5lY3RlZDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG5cbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLl9yZW5kZXJSb290ID0gdGhpcy5jcmVhdGVSZW5kZXJSb290KCk7XG5cbiAgICAgICAgdGhpcy5fbm90aWZ5TGlmZWN5Y2xlKCdjb25zdHJ1Y3RlZCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgZWFjaCB0aW1lIHRoZSBjdXN0b20gZWxlbWVudCBpcyBtb3ZlZCB0byBhIG5ldyBkb2N1bWVudFxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9XZWJfQ29tcG9uZW50cy9Vc2luZ19jdXN0b21fZWxlbWVudHMjVXNpbmdfdGhlX2xpZmVjeWNsZV9jYWxsYmFja3NcbiAgICAgKi9cbiAgICBhZG9wdGVkQ2FsbGJhY2sgKCkge1xuXG4gICAgICAgIHRoaXMuX25vdGlmeUxpZmVjeWNsZSgnYWRvcHRlZCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgZWFjaCB0aW1lIHRoZSBjdXN0b20gZWxlbWVudCBpcyBhcHBlbmRlZCBpbnRvIGEgZG9jdW1lbnQtY29ubmVjdGVkIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvV2ViX0NvbXBvbmVudHMvVXNpbmdfY3VzdG9tX2VsZW1lbnRzI1VzaW5nX3RoZV9saWZlY3ljbGVfY2FsbGJhY2tzXG4gICAgICovXG4gICAgY29ubmVjdGVkQ2FsbGJhY2sgKCkge1xuXG4gICAgICAgIHRoaXMuX2xpc3RlbigpO1xuXG4gICAgICAgIHRoaXMucmVxdWVzdFVwZGF0ZSgpO1xuXG4gICAgICAgIHRoaXMuX25vdGlmeUxpZmVjeWNsZSgnY29ubmVjdGVkJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW52b2tlZCBlYWNoIHRpbWUgdGhlIGN1c3RvbSBlbGVtZW50IGlzIGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSBkb2N1bWVudCdzIERPTVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9XZWJfQ29tcG9uZW50cy9Vc2luZ19jdXN0b21fZWxlbWVudHMjVXNpbmdfdGhlX2xpZmVjeWNsZV9jYWxsYmFja3NcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjayAoKSB7XG5cbiAgICAgICAgdGhpcy5fdW5saXN0ZW4oKTtcblxuICAgICAgICB0aGlzLl9ub3RpZnlMaWZlY3ljbGUoJ2Rpc2Nvbm5lY3RlZCcpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgZWFjaCB0aW1lIG9uZSBvZiB0aGUgY3VzdG9tIGVsZW1lbnQncyBhdHRyaWJ1dGVzIGlzIGFkZGVkLCByZW1vdmVkLCBvciBjaGFuZ2VkXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFdoaWNoIGF0dHJpYnV0ZXMgdG8gbm90aWNlIGNoYW5nZSBmb3IgaXMgc3BlY2lmaWVkIGluIHtAbGluayBvYnNlcnZlZEF0dHJpYnV0ZXN9LlxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL1dlYl9Db21wb25lbnRzL1VzaW5nX2N1c3RvbV9lbGVtZW50cyNVc2luZ190aGVfbGlmZWN5Y2xlX2NhbGxiYWNrc1xuICAgICAqXG4gICAgICogRm9yIGRlY29yYXRlZCBwcm9wZXJ0aWVzIHdpdGggYW4gYXNzb2NpYXRlZCBhdHRyaWJ1dGUsIHRoaXMgaXMgaGFuZGxlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgY2FuIGJlIG92ZXJyaWRkZW4gdG8gY3VzdG9taXplIHRoZSBoYW5kbGluZyBvZiBhdHRyaWJ1dGUgY2hhbmdlcy4gV2hlbiBvdmVycmlkaW5nXG4gICAgICogdGhpcyBtZXRob2QsIGEgc3VwZXItY2FsbCBzaG91bGQgYmUgaW5jbHVkZWQsIHRvIGVuc3VyZSBhdHRyaWJ1dGUgY2hhbmdlcyBmb3IgZGVjb3JhdGVkIHByb3BlcnRpZXNcbiAgICAgKiBhcmUgcHJvY2Vzc2VkIGNvcnJlY3RseSBhbmQgbGlmZWN5Y2xlLWV2ZW50cyBhcmUgZGlzcGF0Y2hlZC5cbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiBAY3VzdG9tRWxlbWVudCh7XG4gICAgICogICAgICBzZWxlY3RvcjogJ215LWVsZW1lbnQnXG4gICAgICogfSlcbiAgICAgKiBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICAgKlxuICAgICAqICAgICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIChhdHRyaWJ1dGU6IHN0cmluZywgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkge1xuICAgICAqXG4gICAgICogICAgICAgICAgc3VwZXIuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJpYnV0ZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgKlxuICAgICAqICAgICAgICAgIC8vIGRvIGN1c3RvbSBoYW5kbGluZy4uLlxuICAgICAqICAgICAgfVxuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSBhdHRyaWJ1dGUgVGhlIG5hbWUgb2YgdGhlIGNoYW5nZWQgYXR0cmlidXRlXG4gICAgICogQHBhcmFtIG9sZFZhbHVlICBUaGUgb2xkIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGVcbiAgICAgKiBAcGFyYW0gbmV3VmFsdWUgIFRoZSBuZXcgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgICAqL1xuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAoYXR0cmlidXRlOiBzdHJpbmcsIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpIHtcblxuICAgICAgICBpZiAodGhpcy5faXNSZWZsZWN0aW5nKSByZXR1cm47XG5cbiAgICAgICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkgdGhpcy5yZWZsZWN0QXR0cmlidXRlKGF0dHJpYnV0ZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcblxuICAgICAgICB0aGlzLl9ub3RpZnlMaWZlY3ljbGUoJ2F0dHJpYnV0ZUNoYW5nZWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnZva2VkIGVhY2ggdGltZSB0aGUgY3VzdG9tIGVsZW1lbnQgcmVuZGVyc1xuICAgICAqL1xuICAgIHJlbmRlckNhbGxiYWNrICgpIHtcblxuICAgICAgICB0aGlzLl9ub3RpZnlMaWZlY3ljbGUoJ3JlbmRlcicpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludm9rZWQgZWFjaCB0aW1lIHRoZSBjdXN0b20gZWxlbWVudCB1cGRhdGVzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhbmdlZFByb3BlcnRpZXMgQSBtYXAgb2YgcHJvcGVydGllcyB0aGF0IGNoYW5nZWQgaW4gdGhlIHVwZGF0ZSwgY29udGFpbmcgdGhlIHByb3BlcnR5IGtleSBhbmQgdGhlIG9sZCB2YWx1ZVxuICAgICAqL1xuICAgIHVwZGF0ZUNhbGxiYWNrIChjaGFuZ2VkUHJvcGVydGllcz86IE1hcDxQcm9wZXJ0eUtleSwgYW55Pikge1xuXG4gICAgICAgIHRoaXMuX25vdGlmeUxpZmVjeWNsZSgndXBkYXRlJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgY3VzdG9tIGVsZW1lbnQncyByZW5kZXIgcm9vdFxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGUgcmVuZGVyIHJvb3QgaXMgd2hlcmUgdGhlIHtAbGluayByZW5kZXJ9IG1ldGhvZCB3aWxsIGF0dGFjaCBpdHMgRE9NIG91dHB1dC5cbiAgICAgKiBXaGVuIHVzaW5nIHRoZSBjdXN0b20gZWxlbWVudCB3aXRoIHNoYWRvdyBtb2RlLCBpdCB3aWxsIGJlIGEgc2hhZG93IHJvb3QsXG4gICAgICogb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdGhlIGN1c3RvbSBlbGVtZW50IGl0c2VsZi5cbiAgICAgKlxuICAgICAqIFRPRE86IENhbiBzbG90cyBiZSB1c2VkIHdpdGhvdXQgc2hhZG93IERPTT9cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgY3JlYXRlUmVuZGVyUm9vdCAoKTogRWxlbWVudCB8IERvY3VtZW50RnJhZ21lbnQge1xuXG4gICAgICAgIHJldHVybiAodGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgQ3VzdG9tRWxlbWVudCkuc2hhZG93ID9cbiAgICAgICAgICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogJ29wZW4nIH0pIDpcbiAgICAgICAgICAgIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdGVtcGxhdGUgb2YgdGhlIGN1c3RvbSBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIE92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIHByb3ZpZGUgYSB0ZW1wbGF0ZSBmb3IgeW91ciBjdXN0b20gZWxlbWVudC4gVGhlIG1ldGhvZCBtdXN0XG4gICAgICogcmV0dXJuIGEge0BsaW5rIGxpdC1odG1sI1RlbXBsYXRlUmVzdWx0fSB3aGljaCBpcyBjcmVhdGVkIHVzaW5nIGxpdC1odG1sJ3NcbiAgICAgKiB7QGxpbmsgbGl0LWh0bWwjaHRtbCB8IGBodG1sYH0gb3Ige0BsaW5rIGxpdC1odG1sI3N2ZyB8IGBzdmdgfSB0ZW1wbGF0ZSBtZXRob2RzLlxuICAgICAqXG4gICAgICogUmV0dXJuIG5vdGhpbmcgaWYgeW91ciBjb21wb25lbnQgZG9lcyBub3QgbmVlZCB0byByZW5kZXIgYSB0ZW1wbGF0ZS5cbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiBpbXBvcnQgeyBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuICAgICAqXG4gICAgICogQGN1c3RvbUVsZW1lbnQoe1xuICAgICAqICAgICAgc2VsZWN0b3I6ICdteS1lbGVtZW50J1xuICAgICAqIH0pXG4gICAgICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgICpcbiAgICAgKiAgICAgICBteVByb3BlcnR5ID0gJ0hlbGxvJztcbiAgICAgKlxuICAgICAqICAgICAgdGVtcGxhdGUgKCkge1xuICAgICAqXG4gICAgICogICAgICAgICAgaHRtbGA8aDE+JHt0aGlzLm15UHJvcGVydHl9IFdvcmxkITwvaDE+YDtcbiAgICAgKiAgICAgIH1cbiAgICAgKiB9XG4gICAgICogYGBgXG4gICAgICovXG4gICAgcHJvdGVjdGVkIHRlbXBsYXRlICgpOiBUZW1wbGF0ZVJlc3VsdCB8IHZvaWQgeyB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXJzIHRoZSBjdXN0b20gZWxlbWVudCdzIHRlbXBsYXRlIHRvIGl0cyB7QGxpbmsgX3JlbmRlclJvb3R9XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFVzZXMgbGl0LWh0bWwncyB7QGxpbmsgbGl0LWh0bWwjcmVuZGVyfSBtZXRob2QgdG8gcmVuZGVyIGEge0BsaW5rIGxpdC1odG1sI1RlbXBsYXRlUmVzdWx0fS5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgcmVuZGVyICgpIHtcblxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGUoKTtcblxuICAgICAgICBpZiAodGVtcGxhdGUpIHJlbmRlcih0ZW1wbGF0ZSwgdGhpcy5fcmVuZGVyUm9vdCk7XG5cbiAgICAgICAgdGhpcy5yZW5kZXJDYWxsYmFjaygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdhdGNoIHByb3BlcnR5IGNoYW5nZXMgb2NjdXJyaW5nIGluIHRoZSBleGVjdXRvciBhbmQgcmFpc2UgY3VzdG9tIGV2ZW50c1xuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBQcm9wZXJ0eSBjaGFuZ2VzIHNob3VsZCB0cmlnZ2VyIGN1c3RvbSBldmVudHMgd2hlbiB0aGV5IGFyZSBjYXVzZWQgYnkgaW50ZXJuYWwgc3RhdGUgY2hhbmdlcyxcbiAgICAgKiBidXQgbm90IGlmIHRoZXkgYXJlIGNhdXNlZCBieSBhIGNvbnN1bWVyIG9mIHRoZSBjdXN0b20gZWxlbWVudCBBUEkgZGlyZWN0bHksIGUuZy46XG4gICAgICpcbiAgICAgKiBgYGB0eXBlc2NyaXB0XG4gICAgICogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbXktY3VzdG9tLWVsZW1lbnQnKS5jdXN0b21Qcm9wZXJ0eSA9IHRydWU7XG4gICAgICogYGBgLlxuICAgICAqXG4gICAgICogVGhpcyBtZWFucywgd2UgY2Fubm90IGF1dG9tYXRlIHRoaXMgcHJvY2VzcyB0aHJvdWdoIHByb3BlcnR5IHNldHRlcnMsIGFzIHdlIGNhbid0IGJlIHN1cmUgd2hvXG4gICAgICogaW52b2tlZCB0aGUgc2V0dGVyIC0gaW50ZXJuYWwgY2FsbHMgb3IgZXh0ZXJuYWwgY2FsbHMuXG4gICAgICpcbiAgICAgKiBPbmUgb3B0aW9uIGlzIHRvIG1hbnVhbGx5IHJhaXNlIHRoZSBldmVudCwgd2hpY2ggY2FuIGJlY29tZSB0ZWRpb3VzIGFuZCBmb3JjZXMgdXMgdG8gdXNlIHN0cmluZy1cbiAgICAgKiBiYXNlZCBldmVudCBuYW1lcyBvciBwcm9wZXJ0eSBuYW1lcywgd2hpY2ggYXJlIGRpZmZpY3VsdCB0byByZWZhY3RvciwgZS5nLjpcbiAgICAgKlxuICAgICAqIGBgYHR5cGVzY3JpcHRcbiAgICAgKiB0aGlzLmN1c3RvbVByb3BlcnR5ID0gdHJ1ZTtcbiAgICAgKiAvLyBpZiB3ZSByZWZhY3RvciB0aGUgcHJvcGVydHkgbmFtZSwgd2UgY2FuIGVhc2lseSBtaXNzIHRoZSBub3RpZnkgY2FsbFxuICAgICAqIHRoaXMubm90aWZ5KCdjdXN0b21Qcm9wZXJ0eScpO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQSBtb3JlIGNvbnZlbmllbnQgd2F5IGlzIHRvIGV4ZWN1dGUgdGhlIGludGVybmFsIGNoYW5nZXMgaW4gYSB3cmFwcGVyIHdoaWNoIGNhbiBkZXRlY3QgdGhlIGNoYW5nZWRcbiAgICAgKiBwcm9wZXJ0aWVzIGFuZCB3aWxsIGF1dG9tYXRpY2FsbHkgcmFpc2UgdGhlIHJlcXVpcmVkIGV2ZW50cy4gVGhpcyBlbGltaW5hdGVzIHRoZSBuZWVkIHRvIG1hbnVhbGx5XG4gICAgICogcmFpc2UgZXZlbnRzIGFuZCByZWZhY3RvcmluZyBkb2VzIG5vIGxvbmdlciBhZmZlY3QgdGhlIHByb2Nlc3MuXG4gICAgICpcbiAgICAgKiBgYGB0eXBlc2NyaXB0XG4gICAgICogdGhpcy53YXRjaCgoKSA9PiB7XG4gICAgICpcbiAgICAgKiAgICAgIHRoaXMuY3VzdG9tUHJvcGVydHkgPSB0cnVlO1xuICAgICAqICAgICAgLy8gd2UgY2FuIGFkZCBtb3JlIHByb3BlcnR5IG1vZGlmaWNhdGlvbnMgdG8gbm90aWZ5IGluIGhlcmVcbiAgICAgKiB9KTtcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSBleGVjdXRvciBBIGZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGhlIGNoYW5nZXMgd2hpY2ggc2hvdWxkIGJlIG5vdGlmaWVkXG4gICAgICovXG4gICAgd2F0Y2ggKGV4ZWN1dG9yOiAoKSA9PiB2b2lkKSB7XG5cbiAgICAgICAgLy8gYmFjayB1cCBjdXJyZW50IGNoYW5nZWQgcHJvcGVydGllc1xuICAgICAgICBjb25zdCBwcmV2aW91c0NoYW5nZXMgPSBuZXcgTWFwKHRoaXMuX2NoYW5nZWRQcm9wZXJ0aWVzKTtcblxuICAgICAgICAvLyBleGVjdXRlIHRoZSBjaGFuZ2VzXG4gICAgICAgIGV4ZWN1dG9yKCk7XG5cbiAgICAgICAgLy8gYWRkIGFsbCBuZXcgb3IgdXBkYXRlZCBjaGFuZ2VkIHByb3BlcnRpZXMgdG8gdGhlIG5vdGlmeWluZyBwcm9wZXJ0aWVzXG4gICAgICAgIGZvciAoY29uc3QgW3Byb3BlcnR5S2V5LCBvbGRWYWx1ZV0gb2YgdGhpcy5fY2hhbmdlZFByb3BlcnRpZXMpIHtcblxuICAgICAgICAgICAgaWYgKCFwcmV2aW91c0NoYW5nZXMuaGFzKHByb3BlcnR5S2V5KSB8fCBwcmV2aW91c0NoYW5nZXMuZ2V0KHByb3BlcnR5S2V5KSAhPT0gb2xkVmFsdWUpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX25vdGlmeWluZ1Byb3BlcnRpZXMuc2V0KHByb3BlcnR5S2V5LCBvbGRWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGFuIHVwZGF0ZSBvZiB0aGUgY3VzdG9tIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGF1dG9tYXRpY2FsbHkgd2hlbiB0aGUgdmFsdWUgb2YgYSBkZWNvcmF0ZWQgcHJvcGVydHkgb3IgaXRzIGFzc29jaWF0ZWRcbiAgICAgKiBhdHRyaWJ1dGUgY2hhbmdlcy4gSWYgeW91IG5lZWQgdGhlIGN1c3RvbSBlbGVtZW50IHRvIHVwZGF0ZSBiYXNlZCBvbiBhIHN0YXRlIGNoYW5nZSB0aGF0IGlzXG4gICAgICogbm90IGNvdmVyZWQgYnkgYSBkZWNvcmF0ZWQgcHJvcGVydHksIGNhbGwgdGhpcyBtZXRob2Qgd2l0aG91dCBhbnkgYXJndW1lbnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5ICAgVGhlIG5hbWUgb2YgdGhlIGNoYW5nZWQgcHJvcGVydHkgdGhhdCByZXF1ZXN0cyB0aGUgdXBkYXRlXG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIHRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKiBAcmV0dXJucyAgICAgICAgICAgICBBIFByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGUgdXBkYXRlIGlzIGNvbXBsZXRlZFxuICAgICAqL1xuICAgIHJlcXVlc3RVcGRhdGUgKHByb3BlcnR5S2V5PzogUHJvcGVydHlLZXksIG9sZFZhbHVlPzogYW55LCBuZXdWYWx1ZT86IGFueSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZXF1ZXN0VXBkYXRlKCkuLi4gJywgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lKTtcblxuICAgICAgICBpZiAocHJvcGVydHlLZXkpIHtcblxuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlEZWNsYXJhdGlvbiA9IHRoaXMuX2dldFByb3BlcnR5RGVjbGFyYXRpb24ocHJvcGVydHlLZXkpO1xuXG4gICAgICAgICAgICBpZiAocHJvcGVydHlEZWNsYXJhdGlvbikge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgeyBvYnNlcnZlIH0gPSBwcm9wZXJ0eURlY2xhcmF0aW9uO1xuXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgcHJvcGVydHkgaXMgb2JzZXJ2ZWRcbiAgICAgICAgICAgICAgICBpZiAoIW9ic2VydmUpIHJldHVybiB0aGlzLl91cGRhdGVSZXF1ZXN0O1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGByZXF1ZXN0VXBkYXRlKCkuLi4gJHsgU3RyaW5nKHByb3BlcnR5S2V5KSB9IG9ic2VydmU6ICR7ICEhb2JzZXJ2ZSB9YCk7XG5cbiAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBwcm9wZXJ0eSBoYXMgY2hhbmdlZFxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JzZXJ2ZSA9PT0gJ2Z1bmN0aW9uJyAmJiAhb2JzZXJ2ZShvbGRWYWx1ZSwgbmV3VmFsdWUpKSByZXR1cm4gdGhpcy5fdXBkYXRlUmVxdWVzdDtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgcmVxdWVzdFVwZGF0ZSgpLi4uICR7IFN0cmluZyhwcm9wZXJ0eUtleSkgfSBjaGFuZ2VkYCk7XG5cbiAgICAgICAgICAgICAgICAvLyBzdG9yZSBjaGFuZ2VkIHByb3BlcnR5IGZvciBiYXRjaCBwcm9jZXNzaW5nXG4gICAgICAgICAgICAgICAgdGhpcy5fY2hhbmdlZFByb3BlcnRpZXMuc2V0KHByb3BlcnR5S2V5LCBvbGRWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSBhcmUgaW4gcmVmbGVjdGluZyBzdGF0ZSwgYW4gYXR0cmlidXRlIGlzIHJlZmxlY3RpbmcgdG8gdGhpcyBwcm9wZXJ0eSBhbmQgd2VcbiAgICAgICAgICAgICAgICAvLyBjYW4gc2tpcCByZWZsZWN0aW5nIHRoZSBwcm9wZXJ0eSBiYWNrIHRvIHRoZSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0eSBjaGFuZ2VzIG5lZWQgdG8gYmUgdHJhY2tlZCBob3dldmVyIGFuZCB7QGxpbmsgcmVuZGVyfSBtdXN0IGJlIGNhbGxlZCBhZnRlclxuICAgICAgICAgICAgICAgIC8vIHRoZSBhdHRyaWJ1dGUgY2hhbmdlIGlzIHJlZmxlY3RlZCB0byB0aGlzIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1JlZmxlY3RpbmcpIHRoaXMuX3JlZmxlY3RpbmdQcm9wZXJ0aWVzLnNldChwcm9wZXJ0eUtleSwgb2xkVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9oYXNSZXF1ZXN0ZWRVcGRhdGUpIHtcblxuICAgICAgICAgICAgLy8gZW5xdWV1ZSB1cGRhdGUgcmVxdWVzdCBpZiBub25lIHdhcyBlbnF1ZXVlZCBhbHJlYWR5XG4gICAgICAgICAgICB0aGlzLl9lbnF1ZXVlVXBkYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fdXBkYXRlUmVxdWVzdDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBjdXN0b20gZWxlbWVudCBhZnRlciBhbiB1cGRhdGUgd2FzIHJlcXVlc3RlZCB3aXRoIHtAbGluayByZXF1ZXN0VXBkYXRlfVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIG1ldGhvZCByZW5kZXJzIHRoZSB0ZW1wbGF0ZSwgcmVmbGVjdHMgY2hhbmdlZCBwcm9wZXJ0aWVzIHRvIGF0dHJpYnV0ZXMgYW5kXG4gICAgICogZGlzcGF0Y2hlcyBjaGFuZ2UgZXZlbnRzIGZvciBwcm9wZXJ0aWVzIHdoaWNoIGFyZSBtYXJrZWQgZm9yIG5vdGlmaWNhdGlvbi5cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgdXBkYXRlICgpIHtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIC8vIHJlZmxlY3QgYWxsIHByb3BlcnRpZXMgbWFya2VkIGZvciByZWZsZWN0aW9uXG4gICAgICAgIHRoaXMuX3JlZmxlY3RpbmdQcm9wZXJ0aWVzLmZvckVhY2goKG9sZFZhbHVlOiBhbnksIHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLnJlZmxlY3RQcm9wZXJ0eShwcm9wZXJ0eUtleSwgb2xkVmFsdWUsIHRoaXNbcHJvcGVydHlLZXkgYXMga2V5b2YgQ3VzdG9tRWxlbWVudF0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBub3RpZnkgYWxsIHByb3BlcnRpZXMgbWFya2VkIGZvciBub3RpZmljYXRpb25cbiAgICAgICAgdGhpcy5fbm90aWZ5aW5nUHJvcGVydGllcy5mb3JFYWNoKChvbGRWYWx1ZSwgcHJvcGVydHlLZXkpID0+IHtcblxuICAgICAgICAgICAgdGhpcy5ub3RpZnlQcm9wZXJ0eShwcm9wZXJ0eUtleSwgb2xkVmFsdWUsIHRoaXNbcHJvcGVydHlLZXkgYXMga2V5b2YgQ3VzdG9tRWxlbWVudF0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnVwZGF0ZUNhbGxiYWNrKHRoaXMuX2NoYW5nZWRQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZsZWN0IGFuIGF0dHJpYnV0ZSB2YWx1ZSB0byBpdHMgYXNzb2NpYXRlZCBwcm9wZXJ0eVxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGlzIG1ldGhvZCBjaGVja3MsIGlmIGFueSBjdXN0b20ge0BsaW5rIEF0dHJpYnV0ZVJlZmxlY3Rvcn0gaGFzIGJlZW4gZGVmaW5lZCBmb3IgdGhlXG4gICAgICogYXNzb2NpYXRlZCBwcm9wZXJ0eSBhbmQgaW52b2tlcyB0aGUgYXBwcm9wcmlhdGUgcmVmbGVjdG9yLiBJZiBub3QsIGl0IHdpbGwgdXNlIHRoZSBkZWZhdWx0XG4gICAgICogcmVmbGVjdG9yIHtAbGluayBfcmVmbGVjdEF0dHJpYnV0ZX0uXG4gICAgICpcbiAgICAgKiBJdCBjYXRjaGVzIGFueSBlcnJvciBpbiBjdXN0b20ge0BsaW5rIEF0dHJpYnV0ZVJlZmxlY3Rvcn1zIGFuZCB0aHJvd3MgYSBtb3JlIGhlbHBmdWwgb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIGF0dHJpYnV0ZU5hbWUgVGhlIHByb3BlcnQga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byByZWZsZWN0XG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgcmVmbGVjdEF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKSB7XG5cbiAgICAgICAgY29uc3QgY29uc3RydWN0b3IgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDdXN0b21FbGVtZW50O1xuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5S2V5ID0gY29uc3RydWN0b3IuYXR0cmlidXRlcy5nZXQoYXR0cmlidXRlTmFtZSk7XG5cbiAgICAgICAgLy8gaWdub3JlIHVzZXItZGVmaW5lZCBvYnNlcnZlZCBhdHRyaWJ1dGVzXG4gICAgICAgIC8vIFRPRE86IHRlc3QgdGhpc1xuICAgICAgICBpZiAoIXByb3BlcnR5S2V5KSB7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBvYnNlcnZlZCBhdHRyaWJ1dGUgXCIkeyBhdHRyaWJ1dGVOYW1lIH1cIiBub3QgZm91bmQuLi4gaWdub3JpbmcuLi5gKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcGVydHlEZWNsYXJhdGlvbiA9IHRoaXMuX2dldFByb3BlcnR5RGVjbGFyYXRpb24ocHJvcGVydHlLZXkpITtcblxuICAgICAgICAvLyBkb24ndCByZWZsZWN0IGlmIHtAbGluayBwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RBdHRyaWJ1dGV9IGlzIGZhbHNlXG4gICAgICAgIGlmIChwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RBdHRyaWJ1dGUpIHtcblxuICAgICAgICAgICAgdGhpcy5faXNSZWZsZWN0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKGlzQXR0cmlidXRlUmVmbGVjdG9yKHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZSkpIHtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdEF0dHJpYnV0ZS5jYWxsKHRoaXMsIGF0dHJpYnV0ZU5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IEFUVFJJQlVURV9SRUZMRUNUT1JfRVJST1IocHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0QXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNQcm9wZXJ0eUtleShwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RBdHRyaWJ1dGUpKSB7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAodGhpc1twcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RBdHRyaWJ1dGVdIGFzIEF0dHJpYnV0ZVJlZmxlY3RvcikoYXR0cmlidXRlTmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcblxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgQVRUUklCVVRFX1JFRkxFQ1RPUl9FUlJPUihwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlZmxlY3RBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faXNSZWZsZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZsZWN0IGEgcHJvcGVydHkgdmFsdWUgdG8gaXRzIGFzc29jaWF0ZWQgYXR0cmlidXRlXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoaXMgbWV0aG9kIGNoZWNrcywgaWYgYW55IGN1c3RvbSB7QGxpbmsgUHJvcGVydHlSZWZsZWN0b3J9IGhhcyBiZWVuIGRlZmluZWQgZm9yIHRoZVxuICAgICAqIHByb3BlcnR5IGFuZCBpbnZva2VzIHRoZSBhcHByb3ByaWF0ZSByZWZsZWN0b3IuIElmIG5vdCwgaXQgd2lsbCB1c2UgdGhlIGRlZmF1bHRcbiAgICAgKiByZWZsZWN0b3Ige0BsaW5rIF9yZWZsZWN0UHJvcGVydHl9LlxuICAgICAqXG4gICAgICogSXQgY2F0Y2hlcyBhbnkgZXJyb3IgaW4gY3VzdG9tIHtAbGluayBQcm9wZXJ0eVJlZmxlY3Rvcn1zIGFuZCB0aHJvd3MgYSBtb3JlIGhlbHBmdWwgb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5ICAgVGhlIHByb3BlcnQga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byByZWZsZWN0XG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqIEBwYXJhbSBuZXdWYWx1ZSAgICAgIFRoZSBuZXcgcHJvcGVydHkgdmFsdWVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgcmVmbGVjdFByb3BlcnR5IChwcm9wZXJ0eUtleTogUHJvcGVydHlLZXksIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpIHtcblxuICAgICAgICBjb25zdCBwcm9wZXJ0eURlY2xhcmF0aW9uID0gdGhpcy5fZ2V0UHJvcGVydHlEZWNsYXJhdGlvbihwcm9wZXJ0eUtleSk7XG5cbiAgICAgICAgLy8gZG9uJ3QgcmVmbGVjdCBpZiB7QGxpbmsgcHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHl9IGlzIGZhbHNlXG4gICAgICAgIGlmIChwcm9wZXJ0eURlY2xhcmF0aW9uICYmIHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdFByb3BlcnR5KSB7XG5cbiAgICAgICAgICAgIC8vIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayBpcyBjYWxsZWQgc3luY2hyb25vdXNseSwgd2UgY2FuIGNhdGNoIHRoZSBzdGF0ZSB0aGVyZVxuICAgICAgICAgICAgdGhpcy5faXNSZWZsZWN0aW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKGlzUHJvcGVydHlSZWZsZWN0b3IocHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHkpKSB7XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eURlY2xhcmF0aW9uLnJlZmxlY3RQcm9wZXJ0eS5jYWxsKHRoaXMsIHByb3BlcnR5S2V5LCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBQUk9QRVJUWV9SRUZMRUNUT1JfRVJST1IocHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1Byb3BlcnR5S2V5KHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdFByb3BlcnR5KSkge1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgKHRoaXNbcHJvcGVydHlEZWNsYXJhdGlvbi5yZWZsZWN0UHJvcGVydHldIGFzIFByb3BlcnR5UmVmbGVjdG9yKShwcm9wZXJ0eUtleSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcblxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgUFJPUEVSVFlfUkVGTEVDVE9SX0VSUk9SKHByb3BlcnR5RGVjbGFyYXRpb24ucmVmbGVjdFByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZWZsZWN0UHJvcGVydHkocHJvcGVydHlLZXksIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2lzUmVmbGVjdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmFpc2UgYW4gZXZlbnQgZm9yIGEgcHJvcGVydHkgY2hhbmdlXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoaXMgbWV0aG9kIGNoZWNrcywgaWYgYW55IGN1c3RvbSB7QGxpbmsgUHJvcGVydHlOb3RpZmllcn0gaGFzIGJlZW4gZGVmaW5lZCBmb3IgdGhlXG4gICAgICogcHJvcGVydHkgYW5kIGludm9rZXMgdGhlIGFwcHJvcHJpYXRlIG5vdGlmaWVyLiBJZiBub3QsIGl0IHdpbGwgdXNlIHRoZSBkZWZhdWx0XG4gICAgICogbm90aWZpZXIge0BsaW5rIF9ub3RpZnlQcm9wZXJ0eX0uXG4gICAgICpcbiAgICAgKiBJdCBjYXRjaGVzIGFueSBlcnJvciBpbiBjdXN0b20ge0BsaW5rIFByb3BlcnR5UmVmbGVjdG9yfXMgYW5kIHRocm93cyBhIG1vcmUgaGVscGZ1bCBvbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJvcGVydHlLZXkgICBUaGUgcHJvcGVydCBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIHJhaXNlIGFuIGV2ZW50IGZvclxuICAgICAqIEBwYXJhbSBvbGRWYWx1ZSAgICAgIFRoZSBvbGQgcHJvcGVydHkgdmFsdWVcbiAgICAgKiBAcGFyYW0gbmV3VmFsdWUgICAgICBUaGUgbmV3IHByb3BlcnR5IHZhbHVlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIG5vdGlmeVByb3BlcnR5IChwcm9wZXJ0eUtleTogUHJvcGVydHlLZXksIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpIHtcblxuICAgICAgICBjb25zdCBwcm9wZXJ0eURlY2xhcmF0aW9uID0gdGhpcy5fZ2V0UHJvcGVydHlEZWNsYXJhdGlvbihwcm9wZXJ0eUtleSk7XG5cbiAgICAgICAgaWYgKHByb3BlcnR5RGVjbGFyYXRpb24gJiYgcHJvcGVydHlEZWNsYXJhdGlvbi5ub3RpZnkpIHtcblxuICAgICAgICAgICAgaWYgKGlzUHJvcGVydHlOb3RpZmllcihwcm9wZXJ0eURlY2xhcmF0aW9uLm5vdGlmeSkpIHtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5RGVjbGFyYXRpb24ubm90aWZ5LmNhbGwodGhpcywgcHJvcGVydHlLZXksIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG5cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFBST1BFUlRZX05PVElGSUVSX0VSUk9SKHByb3BlcnR5RGVjbGFyYXRpb24ubm90aWZ5LnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIGlmIChpc1Byb3BlcnR5S2V5KHByb3BlcnR5RGVjbGFyYXRpb24ubm90aWZ5KSkge1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgKHRoaXNbcHJvcGVydHlEZWNsYXJhdGlvbi5ub3RpZnldIGFzIFByb3BlcnR5Tm90aWZpZXIpKHByb3BlcnR5S2V5LCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBQUk9QRVJUWV9OT1RJRklFUl9FUlJPUihwcm9wZXJ0eURlY2xhcmF0aW9uLm5vdGlmeSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fbm90aWZ5UHJvcGVydHkocHJvcGVydHlLZXksIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGVmYXVsdCBhdHRyaWJ1dGUgcmVmbGVjdG9yXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIElmIG5vIHtAbGluayBBdHRyaWJ1dGVSZWZsZWN0b3J9IGlzIGRlZmluZWQgaW4gdGhlIHtAbGluayBQcm9wZXJ0eURlY2xhcmF0aW9ufSB0aGlzXG4gICAgICogbWV0aG9kIGlzIHVzZWQgdG8gcmVmbGVjdCB0aGUgYXR0cmlidXRlIHZhbHVlIHRvIGl0cyBhc3NvY2lhdGVkIHByb3BlcnR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIGF0dHJpYnV0ZU5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byByZWZsZWN0XG4gICAgICogQHBhcmFtIG9sZFZhbHVlICAgICAgVGhlIG9sZCBhdHRyaWJ1dGUgdmFsdWVcbiAgICAgKiBAcGFyYW0gbmV3VmFsdWUgICAgICBUaGUgbmV3IGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3JlZmxlY3RBdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWU6IHN0cmluZywgb2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZykge1xuXG4gICAgICAgIGNvbnN0IGNvbnN0cnVjdG9yID0gdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgQ3VzdG9tRWxlbWVudDtcblxuICAgICAgICBjb25zdCBwcm9wZXJ0eUtleSA9IGNvbnN0cnVjdG9yLmF0dHJpYnV0ZXMuZ2V0KGF0dHJpYnV0ZU5hbWUpITtcblxuICAgICAgICBjb25zdCBwcm9wZXJ0eURlY2xhcmF0aW9uID0gdGhpcy5fZ2V0UHJvcGVydHlEZWNsYXJhdGlvbihwcm9wZXJ0eUtleSkhO1xuXG4gICAgICAgIGNvbnN0IHByb3BlcnR5VmFsdWUgPSBwcm9wZXJ0eURlY2xhcmF0aW9uLmNvbnZlcnRlci5mcm9tQXR0cmlidXRlKG5ld1ZhbHVlKTtcblxuICAgICAgICB0aGlzW3Byb3BlcnR5S2V5IGFzIGtleW9mIHRoaXNdID0gcHJvcGVydHlWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGVmYXVsdCBwcm9wZXJ0eSByZWZsZWN0b3JcbiAgICAgKlxuICAgICAqIEByZW1hcmtzXG4gICAgICogSWYgbm8ge0BsaW5rIFByb3BlcnR5UmVmbGVjdG9yfSBpcyBkZWZpbmVkIGluIHRoZSB7QGxpbmsgUHJvcGVydHlEZWNsYXJhdGlvbn0gdGhpc1xuICAgICAqIG1ldGhvZCBpcyB1c2VkIHRvIHJlZmxlY3QgdGhlIHByb3BlcnR5IHZhbHVlIHRvIGl0cyBhc3NvY2lhdGVkIGF0dHJpYnV0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcm9wZXJ0eUtleSAgIFRoZSBwcm9wZXJ0eSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIHJlZmxlY3RcbiAgICAgKiBAcGFyYW0gb2xkVmFsdWUgICAgICBUaGUgb2xkIHByb3BlcnR5IHZhbHVlXG4gICAgICogQHBhcmFtIG5ld1ZhbHVlICAgICAgVGhlIG5ldyBwcm9wZXJ0eSB2YWx1ZVxuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX3JlZmxlY3RQcm9wZXJ0eSAocHJvcGVydHlLZXk6IFByb3BlcnR5S2V5LCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG5cbiAgICAgICAgLy8gdGhpcyBmdW5jdGlvbiBpcyBvbmx5IGNhbGxlZCBmb3IgcHJvcGVydGllcyB3aGljaCBoYXZlIGEgZGVjbGFyYXRpb25cbiAgICAgICAgY29uc3QgcHJvcGVydHlEZWNsYXJhdGlvbiA9IHRoaXMuX2dldFByb3BlcnR5RGVjbGFyYXRpb24ocHJvcGVydHlLZXkpITtcblxuICAgICAgICAvLyBUT0RPOiB0ZXN0IHdoYXQgaGFwcGVucyBpZiBhdHRyaWJ1dGUgaXMgc2V0IHRvIGZhbHNlIGJ1dCByZWZsZWN0QXR0cmlidXRlIGlzIHRydWUhXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBwcm9wZXJ0eURlY2xhcmF0aW9uLmF0dHJpYnV0ZSBhcyBzdHJpbmc7XG4gICAgICAgIC8vIHJlc29sdmUgdGhlIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IHByb3BlcnR5RGVjbGFyYXRpb24uY29udmVydGVyLnRvQXR0cmlidXRlKG5ld1ZhbHVlKTtcblxuICAgICAgICAvLyB1bmRlZmluZWQgbWVhbnMgZG9uJ3QgY2hhbmdlXG4gICAgICAgIGlmIChhdHRyaWJ1dGVWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBudWxsIG1lYW5zIHJlbW92ZSB0aGUgYXR0cmlidXRlXG4gICAgICAgIGVsc2UgaWYgKGF0dHJpYnV0ZVZhbHVlID09PSBudWxsKSB7XG5cbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3BhdGNoIGEgcHJvcGVydHktY2hhbmdlZCBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5XG4gICAgICogQHBhcmFtIG9sZFZhbHVlXG4gICAgICogQHBhcmFtIG5ld1ZhbHVlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF9ub3RpZnlQcm9wZXJ0eSAocHJvcGVydHlLZXk6IFByb3BlcnR5S2V5LCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgZXZlbnROYW1lID0gY3JlYXRlRXZlbnROYW1lKHByb3BlcnR5S2V5LCAnJywgJ2NoYW5nZWQnKTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICAgICAgY29tcG9zZWQ6IHRydWUsXG4gICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTogcHJvcGVydHlLZXksXG4gICAgICAgICAgICAgICAgcHJldmlvdXM6IG9sZFZhbHVlLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IG5ld1ZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaCBhIGxpZmVjeWNsZSBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGxpZmVjeWNsZSBUaGUgbGlmZWN5Y2xlIGZvciB3aGljaCB0byByYWlzZSB0aGUgZXZlbnRcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX25vdGlmeUxpZmVjeWNsZSAobGlmZWN5Y2xlOiBzdHJpbmcpIHtcblxuICAgICAgICBjb25zdCBldmVudE5hbWUgPSBjcmVhdGVFdmVudE5hbWUobGlmZWN5Y2xlLCAnb24nKTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KGV2ZW50TmFtZSwge1xuICAgICAgICAgICAgY29tcG9zZWQ6IHRydWVcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJpbmQgY3VzdG9tIGVsZW1lbnQgbGlzdGVuZXJzLlxuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgX2xpc3RlbiAoKSB7XG5cbiAgICAgICAgKHRoaXMuY29uc3RydWN0b3IgYXMgdHlwZW9mIEN1c3RvbUVsZW1lbnQpLmxpc3RlbmVycy5mb3JFYWNoKChkZWNsYXJhdGlvbiwgbGlzdGVuZXIpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2VEZWNsYXJhdGlvbjogSW5zdGFuY2VMaXN0ZW5lckRlY2xhcmF0aW9uID0ge1xuXG4gICAgICAgICAgICAgICAgLy8gY29weSB0aGUgY2xhc3MncyBzdGF0aWMgbGlzdGVuZXIgZGVjbGFyYXRpb24gaW50byBhbiBpbnN0YW5jZSBsaXN0ZW5lciBkZWNsYXJhdGlvblxuICAgICAgICAgICAgICAgIGV2ZW50OiBkZWNsYXJhdGlvbi5ldmVudCxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBkZWNsYXJhdGlvbi5vcHRpb25zLFxuXG4gICAgICAgICAgICAgICAgLy8gYmluZCB0aGUgY29tcG9uZW50cyBsaXN0ZW5lciBtZXRob2QgdG8gdGhlIGNvbXBvbmVudCBpbnN0YW5jZSBhbmQgc3RvcmUgaXQgaW4gdGhlIGluc3RhbmNlIGRlY2xhcmF0aW9uXG4gICAgICAgICAgICAgICAgbGlzdGVuZXI6ICh0aGlzW2xpc3RlbmVyIGFzIGtleW9mIHRoaXNdIGFzIHVua25vd24gYXMgRXZlbnRMaXN0ZW5lcikuYmluZCh0aGlzKSxcblxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZSB0aGUgZXZlbnQgdGFyZ2V0IGFuZCBzdG9yZSBpdCBpbiB0aGUgaW5zdGFuY2UgZGVjbGFyYXRpb25cbiAgICAgICAgICAgICAgICB0YXJnZXQ6IChkZWNsYXJhdGlvbi50YXJnZXQpID9cbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBkZWNsYXJhdGlvbi50YXJnZXQgPT09ICdmdW5jdGlvbicpID9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uLnRhcmdldCgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uLnRhcmdldCA6XG4gICAgICAgICAgICAgICAgICAgIHRoaXNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGFkZCB0aGUgYm91bmQgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIHRhcmdldFxuICAgICAgICAgICAgaW5zdGFuY2VEZWNsYXJhdGlvbi50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihpbnN0YW5jZURlY2xhcmF0aW9uLmV2ZW50IGFzIHN0cmluZywgaW5zdGFuY2VEZWNsYXJhdGlvbi5saXN0ZW5lciwgaW5zdGFuY2VEZWNsYXJhdGlvbi5vcHRpb25zKTtcblxuICAgICAgICAgICAgLy8gc2F2ZSB0aGUgaW5zdGFuY2UgbGlzdGVuZXIgZGVjbGFyYXRpb24gb24gdGhlIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJEZWNsYXJhdGlvbnMucHVzaChpbnN0YW5jZURlY2xhcmF0aW9uKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVW5iaW5kIGN1c3RvbSBlbGVtZW50IGxpc3RlbmVycy5cbiAgICAgKlxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJvdGVjdGVkIF91bmxpc3RlbiAoKSB7XG5cbiAgICAgICAgdGhpcy5fbGlzdGVuZXJEZWNsYXJhdGlvbnMuZm9yRWFjaCgoZGVjbGFyYXRpb24pID0+IHtcblxuICAgICAgICAgICAgZGVjbGFyYXRpb24udGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZGVjbGFyYXRpb24uZXZlbnQgYXMgc3RyaW5nLCBkZWNsYXJhdGlvbi5saXN0ZW5lciwgZGVjbGFyYXRpb24ub3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNjaGVkdWxlIHRoZSB1cGRhdGUgb2YgdGhlIGN1c3RvbSBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFNjaGVkdWxlcyB0aGUgdXBkYXRlIG9mIHRoZSBjdXN0b20gZWxlbWVudCBqdXN0IGJlZm9yZSB0aGUgbmV4dCBmcmFtZVxuICAgICAqIGFuZCBjbGVhbnMgdXAgdGhlIGN1c3RvbSBlbGVtZW50cyBzdGF0ZSBhZnRlcndhcmRzLlxuICAgICAqL1xuICAgIHByb3RlY3RlZCBfc2NoZWR1bGVVcGRhdGUgKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcblxuICAgICAgICAgICAgLy8gc2NoZWR1bGUgdGhlIHVwZGF0ZSB2aWEgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRvIGF2b2lkIG11bHRpcGxlIHJlZHJhd3MgcGVyIGZyYW1lXG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2NoYW5nZWRQcm9wZXJ0aWVzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVmbGVjdGluZ1Byb3BlcnRpZXMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9ub3RpZnlpbmdQcm9wZXJ0aWVzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gbWFyayBjdXN0b20gZWxlbWVudCBhcyB1cGRhdGVkIGFmdGVyIHRoZSB1cGRhdGUgdG8gcHJldmVudCBpbmZpbnRlIGxvb3BzIGluIHRoZSB1cGRhdGUgcHJvY2Vzc1xuICAgICAgICAgICAgICAgIC8vIE4uQi46IGFueSBwcm9wZXJ0eSBjaGFuZ2VzIGR1cmluZyB0aGUgdXBkYXRlIHdpbGwgYmUgaWdub3JlZFxuICAgICAgICAgICAgICAgIHRoaXMuX2hhc1JlcXVlc3RlZFVwZGF0ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVucXVldWUgYSByZXF1ZXN0IGZvciBhbiBhc3luY2hyb25vdXMgdXBkYXRlXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBfZW5xdWV1ZVVwZGF0ZSAoKSB7XG5cbiAgICAgICAgbGV0IHJlc29sdmU6IChyZXN1bHQ6IGJvb2xlYW4pID0+IHZvaWQ7XG5cbiAgICAgICAgY29uc3QgcHJldmlvdXNSZXF1ZXN0ID0gdGhpcy5fdXBkYXRlUmVxdWVzdDtcblxuICAgICAgICAvLyBtYXJrIHRoZSBjdXN0b20gZWxlbWVudCBhcyBoYXZpbmcgcmVxdWVzdGVkIGFuIHVwZGF0ZSwgdGhlIHtAbGluayBfcmVxdWVzdFVwZGF0ZX0gbWV0aG9kXG4gICAgICAgIC8vIHdpbGwgbm90IGVucXVldWUgYSBmdXJ0aGVyIHJlcXVlc3QgZm9yIHVwZGF0ZSBpZiBvbmUgaXMgc2NoZWR1bGVkXG4gICAgICAgIHRoaXMuX2hhc1JlcXVlc3RlZFVwZGF0ZSA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlUmVxdWVzdCA9IG5ldyBQcm9taXNlPGJvb2xlYW4+KHJlcyA9PiByZXNvbHZlID0gcmVzKTtcblxuICAgICAgICAvLyB3YWl0IGZvciB0aGUgcHJldmlvdXMgdXBkYXRlIHRvIHJlc29sdmVcbiAgICAgICAgLy8gYGF3YWl0YCBpcyBhc3luY2hyb25vdXMgYW5kIHdpbGwgcmV0dXJuIGV4ZWN1dGlvbiB0byB0aGUge0BsaW5rIHJlcXVlc3RVcGRhdGV9IG1ldGhvZFxuICAgICAgICAvLyBhbmQgZXNzZW50aWFsbHkgYWxsb3dzIHVzIHRvIGJhdGNoIG11bHRpcGxlIHN5bmNocm9ub3VzIHByb3BlcnR5IGNoYW5nZXMsIGJlZm9yZSB0aGVcbiAgICAgICAgLy8gZXhlY3V0aW9uIGNhbiByZXN1bWUgaGVyZVxuICAgICAgICBhd2FpdCBwcmV2aW91c1JlcXVlc3Q7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fc2NoZWR1bGVVcGRhdGUoKTtcblxuICAgICAgICAvLyB0aGUgYWN0dWFsIHVwZGF0ZSBpcyBzY2hlZHVsZWQgYXN5bmNocm9ub3VzbHkgYXMgd2VsbFxuICAgICAgICBhd2FpdCByZXN1bHQ7XG5cbiAgICAgICAgLy8gcmVzb2x2ZSB0aGUgbmV3IHtAbGluayBfdXBkYXRlUmVxdWVzdH0gYWZ0ZXIgdGhlIHJlc3VsdCBvZiB0aGUgY3VycmVudCB1cGRhdGUgcmVzb2x2ZXNcbiAgICAgICAgcmVzb2x2ZSEoIXRoaXMuX2hhc1JlcXVlc3RlZFVwZGF0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUge0BsaW5rIFByb3BlcnR5RGVjbGFyYXRpb259IGZvciBhIGRlY29yYXRlZCBwcm9wZXJ0eVxuICAgICAqXG4gICAgICogQHBhcmFtIHByb3BlcnR5S2V5IFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHdoaWNoIHRvIHJldHJpZXZlIHRoZSBkZWNsYXJhdGlvblxuICAgICAqXG4gICAgICogQGludGVybmFsXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcml2YXRlIF9nZXRQcm9wZXJ0eURlY2xhcmF0aW9uIChwcm9wZXJ0eUtleTogUHJvcGVydHlLZXkpOiBQcm9wZXJ0eURlY2xhcmF0aW9uIHwgdW5kZWZpbmVkIHtcblxuICAgICAgICByZXR1cm4gKHRoaXMuY29uc3RydWN0b3IgYXMgdHlwZW9mIEN1c3RvbUVsZW1lbnQpLnByb3BlcnRpZXMuZ2V0KHByb3BlcnR5S2V5KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDdXN0b21FbGVtZW50IH0gZnJvbSAnLi4vY3VzdG9tLWVsZW1lbnQnO1xuaW1wb3J0IHsgRGVjb3JhdGVkQ3VzdG9tRWxlbWVudFR5cGUgfSBmcm9tICcuL3Byb3BlcnR5JztcblxuLyoqXG4gKiBBIHtAbGluayBDdXN0b21FbGVtZW50fSBkZWNsYXJhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUVsZW1lbnREZWNsYXJhdGlvbiB7XG4gICAgLyoqXG4gICAgICogVGhlIHNlbGVjdG9yIG9mIHRoZSBjdXN0b20gZWxlbWVudFxuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBUaGUgc2VsZWN0b3Igd2lsbCBiZSB1c2VkIHRvIHJlZ2lzdGVyIHRoZSBjdXN0b20gZWxlbWVudCBjb25zdHJ1Y3RvciB3aXRoIHRoZSBicm93c2VyJ3NcbiAgICAgKiB7QGxpbmsgd2luZG93LmN1c3RvbUVsZW1lbnRzfSBBUEkuIElmIG5vIHNlbGVjdG9yIGlzIHNwZWNpZmllZCwgdGhlIGN1c3RvbSBlbGVtZW50IGNsYXNzXG4gICAgICogbmVlZHMgdG8gcHJvdmlkZSBvbmUgaW4gaXRzIHN0YXRpYyB7QGxpbmsgQ3VzdG9tRWxlbWVudC5zZWxlY3Rvcn0gcHJvcGVydHkuXG4gICAgICogQSBzZWxlY3RvciBkZWZpbmVkIGluIHRoZSB7QGxpbmsgQ3VzdG9tRWxlbWVudERlY2xhcmF0aW9ufSB3aWxsIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZVxuICAgICAqIHN0YXRpYyBjbGFzcyBwcm9wZXJ0eS5cbiAgICAgKi9cbiAgICBzZWxlY3Rvcjogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVXNlIFNoYWRvdyBET00gdG8gcmVuZGVyIHRoZSBjdXN0b20gZWxlbWVudHMgdGVtcGxhdGU/XG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFNoYWRvdyBET00gY2FuIGJlIGRpc2FibGVkIGJ5IHNldHRpbmcgdGhpcyBvcHRpb24gdG8gYGZhbHNlYCwgaW4gd2hpY2ggY2FzZSB0aGUgY3VzdG9tXG4gICAgICogZWxlbWVudCdzIHRlbXBsYXRlIHdpbGwgYmUgcmVuZGVyZWQgYXMgY2hpbGQgbm9kZXMgb2YgdGhlIGN1c3RvbSBlbGVtZW50LiBUaGlzIGNhbiBiZVxuICAgICAqIHVzZWZ1bCBpZiBhbiBpc29sYXRlZCBET00gYW5kIHNjb3BlZCBDU1MgaXMgbm90IGRlc2lyZWQuXG4gICAgICpcbiAgICAgKiBEZWZhdWx0IHZhbHVlOiBgdHJ1ZWBcbiAgICAgKi9cbiAgICBzaGFkb3c6IGJvb2xlYW47XG5cbiAgICAvKipcbiAgICAgKiBBdXRvbWF0aWNhbGx5IHJlZ2lzdGVyIHRoZSBjdXN0b20gZWxlbWVudCB3aXRoIHRoZSBicm93c2VyJ3Mge0BsaW5rIHdpbmRvdy5jdXN0b21FbGVtZW50c30gQVBJP1xuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBJbiBjYXNlcyB3aGVyZSB5b3Ugd2FudCB0byBlbXBsb3kgYSBtb2R1bGUgc3lzdGVtIHdoaWNoIHJlZ2lzdGVycyBjdXN0b20gZWxlbWVudHMgb25cbiAgICAgKiBhIGNvbmRpdGlvbmFsIGJhc2lzLCB5b3UgY2FuIGRpc2FibGUgYXV0b21hdGljIHJlZ2lzdHJhdGlvbiBieSBzZXR0aW5nIHRoaXMgb3B0aW9uIHRvXG4gICAgICogYGZhbHNlYC4gWW91ciBtb2R1bGUgb3IgYm9vdHN0cmFwIHN5c3RlbSB3aWxsIGhhdmUgdG8gdGFrZSBjYXJlIG9mIGRlZmluaW5nIHRoZSBjdXN0b21cbiAgICAgKiBlbGVtZW50IGxhdGVyLlxuICAgICAqXG4gICAgICogRGVmYXVsdCB2YWx1ZTogYHRydWVgXG4gICAgICovXG4gICAgZGVmaW5lOiBib29sZWFuO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9DVVNUT01fRUxFTUVOVF9ERUNMQVJBVElPTjogQ3VzdG9tRWxlbWVudERlY2xhcmF0aW9uID0ge1xuICAgIHNlbGVjdG9yOiAnJyxcbiAgICBzaGFkb3c6IHRydWUsXG4gICAgZGVmaW5lOiB0cnVlXG59O1xuXG4vKipcbiAqIERlY29yYXRlcyBhIHtAbGluayBDdXN0b21FbGVtZW50fSBjbGFzc1xuICpcbiAqIEBwYXJhbSBvcHRpb25zIEEgY3VzdG9tIGVsZW1lbnQgZGVjbGFyYXRpb25cbiAqL1xuZXhwb3J0IGNvbnN0IGN1c3RvbUVsZW1lbnQgPSAob3B0aW9uczogUGFydGlhbDxDdXN0b21FbGVtZW50RGVjbGFyYXRpb24+ID0ge30pID0+IHtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uID0geyAuLi5ERUZBVUxUX0NVU1RPTV9FTEVNRU5UX0RFQ0xBUkFUSU9OLCAuLi5vcHRpb25zIH07XG5cbiAgICByZXR1cm4gKHRhcmdldDogdHlwZW9mIEN1c3RvbUVsZW1lbnQpID0+IHtcblxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRhcmdldCBhcyBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZTtcblxuICAgICAgICBjb25zdHJ1Y3Rvci5zZWxlY3RvciA9IGRlY2xhcmF0aW9uLnNlbGVjdG9yIHx8IHRhcmdldC5zZWxlY3RvcjtcbiAgICAgICAgY29uc3RydWN0b3Iuc2hhZG93ID0gZGVjbGFyYXRpb24uc2hhZG93O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm9wZXJ0eSBkZWNvcmF0b3JzIGdldCBjYWxsZWQgYmVmb3JlIGNsYXNzIGRlY29yYXRvcnMsIHNvIGF0IHRoaXMgcG9pbnQgYWxsIGRlY29yYXRlZCBwcm9wZXJ0aWVzXG4gICAgICAgICAqIGhhdmUgc3RvcmVkIHRoZWlyIGFzc29jaWF0ZWQgYXR0cmlidXRlcyBpbiB7QGxpbmsgQ3VzdG9tRWxlbWVudC5hdHRyaWJ1dGVzfS5cbiAgICAgICAgICogV2UgY2FuIG5vdyBjb21iaW5lIHRoZW0gd2l0aCB0aGUgdXNlci1kZWZpbmVkIHtAbGluayBDdXN0b21FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc30gYW5kLFxuICAgICAgICAgKiBieSB1c2luZyBhIFNldCwgZWxpbWluYXRlIGFsbCBkdXBsaWNhdGVzIGluIHRoZSBwcm9jZXNzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBBcyB0aGUgdXNlci1kZWZpbmVkIHtAbGluayBDdXN0b21FbGVtZW50Lm9ic2VydmVkQXR0cmlidXRlc30gd2lsbCBhbHNvIGluY2x1ZGUgZGVjb3JhdG9yIGdlbmVyYXRlZFxuICAgICAgICAgKiBvYnNlcnZlZCBhdHRyaWJ1dGVzLCB3ZSBhbHdheXMgaW5oZXJpdCBhbGwgb2JzZXJ2ZWQgYXR0cmlidXRlcyBmcm9tIGEgYmFzZSBjbGFzcy4gRm9yIHRoYXQgcmVhc29uXG4gICAgICAgICAqIHdlIGhhdmUgdG8ga2VlcCB0cmFjayBvZiBhdHRyaWJ1dGUgb3ZlcnJpZGVzIHdoZW4gZXh0ZW5kaW5nIGFueSB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gYmFzZSBjbGFzcy5cbiAgICAgICAgICogVGhpcyBpcyBkb25lIGluIHRoZSB7QGxpbmsgcHJvcGVydHl9IGRlY29yYXRvci4gSGVyZSB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0byByZW1vdmUgb3ZlcnJpZGRlblxuICAgICAgICAgKiBhdHRyaWJ1dGVzLlxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3Qgb2JzZXJ2ZWRBdHRyaWJ1dGVzID0gW1xuICAgICAgICAgICAgLi4ubmV3IFNldChcbiAgICAgICAgICAgICAgICAvLyB3ZSB0YWtlIHRoZSBpbmhlcml0ZWQgb2JzZXJ2ZWQgYXR0cmlidXRlcy4uLlxuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yLm9ic2VydmVkQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgICAgICAvLyAuLi5yZW1vdmUgb3ZlcnJpZGRlbiBnZW5lcmF0ZWQgYXR0cmlidXRlcy4uLlxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKChhdHRyaWJ1dGVzLCBhdHRyaWJ1dGUpID0+IGF0dHJpYnV0ZXMuY29uY2F0KGNvbnN0cnVjdG9yLm92ZXJyaWRkZW4uaGFzKGF0dHJpYnV0ZSkgPyBbXSA6IGF0dHJpYnV0ZSksIFtdIGFzIHN0cmluZ1tdKVxuICAgICAgICAgICAgICAgICAgICAvLyAuLi5hbmQgcmVjb21iaW5lIHRoZSBsaXN0IHdpdGggdGhlIG5ld2x5IGdlbmVyYXRlZCBhdHRyaWJ1dGVzICh0aGUgU2V0IHByZXZlbnRzIGR1cGxpY2F0ZXMpXG4gICAgICAgICAgICAgICAgICAgIC5jb25jYXQoWy4uLnRhcmdldC5hdHRyaWJ1dGVzLmtleXMoKV0pXG4gICAgICAgICAgICApXG4gICAgICAgIF07XG5cbiAgICAgICAgLy8gVE9ETzogZGVsZXRlIHRoZSBvdmVycmlkZGVuIFNldCBmcm9tIHRoZSBjb25zdHJ1Y3RvclxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaW5hbGx5IHdlIG92ZXJyaWRlIHRoZSB7QGxpbmsgQ3VzdG9tRWxlbWVudC5vYnNlcnZlZEF0dHJpYnV0ZXN9IGdldHRlciB3aXRoIGEgbmV3IG9uZSwgd2hpY2ggcmV0dXJuc1xuICAgICAgICAgKiB0aGUgdW5pcXVlIHNldCBvZiB1c2VyIGRlZmluZWQgYW5kIGRlY29yYXRvciBnZW5lcmF0ZWQgb2JzZXJ2ZWQgYXR0cmlidXRlcy5cbiAgICAgICAgICpcbiAgICAgICAgICogTi5CLjogV2hlbiBleHRlbmRpbmcgYW4gZXhpc3RpbmcgY3VzdG9tIGVsZW1lbnQsIGFuZCBvZXJyaWRpbmcgYSBwcm9wZXJ0eSB3aXRoIGEgZGlmZmVyZW50IGFzc29jaWF0ZWRcbiAgICAgICAgICogYXR0cmlidXRlIG5hbWUsIHRoZSBiYXNlIGNsYXNzJ3Mgb3JpZ2luYWwgYXR0cmlidXRlIG5hbWUgcmVtYWlucyBpbiB0aGUge0BsaW5rIEN1c3RvbUVsZW1lbnQub2JzZXJ2ZWRBdHRyaWJ1dGVzfVxuICAgICAgICAgKiBhcnJheS4gQ2hhbmdpbmcgdGhlIG9sZCBhdHRyaWJ1dGUgb24gdGhlIGV4dGVuZGVkIGNsYXNzIHdpbGwgdHJ5IHRvIHJlZmxlY3QgdGhlIGF0dHJpYnV0ZSwgYnV0IHdvbid0XG4gICAgICAgICAqIGZpbmQgdGhlIGF0dHJpYnV0ZSBpbiB0aGUgZXh0ZW5kZWQgY2xhc3MncyB7QGxpbmsgQ3VzdG9tRWxlbWVudC5hdHRyaWJ1dGVzfSBNYXAgYW5kIHdpbGwgdGhlcmVmb3JlIGJlXG4gICAgICAgICAqIGlnbm9yZWQuXG4gICAgICAgICAqL1xuICAgICAgICBSZWZsZWN0LmRlZmluZVByb3BlcnR5KGNvbnN0cnVjdG9yLCAnb2JzZXJ2ZWRBdHRyaWJ1dGVzJywge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICBnZXQgKCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JzZXJ2ZWRBdHRyaWJ1dGVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZGVjbGFyYXRpb24uZGVmaW5lKSB7XG5cbiAgICAgICAgICAgIHdpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoY29uc3RydWN0b3Iuc2VsZWN0b3IsIGNvbnN0cnVjdG9yKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuIiwiaW1wb3J0IHsgQ3VzdG9tRWxlbWVudCB9IGZyb20gJy4uL2N1c3RvbS1lbGVtZW50JztcblxuLyoqXG4gKiBBIHtAbGluayBDdXN0b21FbGVtZW50fSBldmVudCBsaXN0ZW5lciBkZWNsYXJhdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIExpc3RlbmVyRGVjbGFyYXRpb24ge1xuXG4gICAgLyoqXG4gICAgICogVGhlIGV2ZW50IHRvIGxpc3RlbiB0b1xuICAgICAqXG4gICAgICogQHJlbWFya3NcbiAgICAgKiBTZXR0aW5nIGV2ZW50IHRvIGBudWxsYCBhbGxvd3MgdG8gdW5iaW5kIGFuIGluaGVyaXRlZCBldmVudCBsaXN0ZW5lci5cbiAgICAgKi9cbiAgICBldmVudDogc3RyaW5nIHwgbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEFuIG9wdGlvbnMgb2JqZWN0IHRoYXQgc3BlY2lmaWVzIGNoYXJhY3RlcmlzdGljcyBhYm91dCB0aGUgZXZlbnQgbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvcHRpb25zPzogQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnM7XG5cbiAgICAvKipcbiAgICAgKiBBbiBhbHRlcm5hdGl2ZSBldmVudCB0YXJnZXQgKGJ5IGRlZmF1bHQgdGhpcyB3aWxsIGJlIHRoZSB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gaW5zdGFuY2UpXG4gICAgICpcbiAgICAgKiBAcmVtYXJrc1xuICAgICAqIFRoaXMgY2FuIGJlIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBsaXN0ZW4gdG8gZS5nLjpcbiAgICAgKiAqIHdpbmRvdy5vbnJlc2l6ZVxuICAgICAqICogZG9jdW1lbnQub25sb2FkXG4gICAgICogKiBkb2N1bWVudC5vbnNjcm9sbFxuICAgICAqICogV29ya2VyLm9ubWVzc2FnZSAtIFRPRE86IFRoaXMgY291bGQgYmUgaW50ZXJlc3RpbmcgdG8gc29sdmUsIHdlIG1pZ2h0IG5lZWQgdG8gZ2V0IHRoZSB3b3JrZXIgZnJvbSB0aGVcbiAgICAgKiAgIGNvbXBvbmVudCBpbnN0YW5jZSwgbWF5YmUgYSB1c2UgY2FzZSBmb3IgZGkgQHNlbGYoKVxuICAgICAqL1xuICAgIHRhcmdldD86IEV2ZW50VGFyZ2V0IHwgKCgpID0+IEV2ZW50VGFyZ2V0KTtcbn1cblxuLyoqXG4gKiBEZWNvcmF0ZXMgYSB7QGxpbmsgQ3VzdG9tRWxlbWVudH0gbWV0aG9kIGFzIGFuIGV2ZW50IGxpc3RlbmVyXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgVGhlIGxpc3RlbmVyIGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5lciAob3B0aW9uczogTGlzdGVuZXJEZWNsYXJhdGlvbikge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IE9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG5cbiAgICAgICAgY29uc3QgY29uc3RydWN0b3IgPSB0YXJnZXQuY29uc3RydWN0b3IgYXMgdHlwZW9mIEN1c3RvbUVsZW1lbnQ7XG5cbiAgICAgICAgcHJlcGFyZUNvbnN0cnVjdG9yKGNvbnN0cnVjdG9yKTtcblxuICAgICAgICBpZiAob3B0aW9ucy5ldmVudCA9PT0gbnVsbCkge1xuXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5saXN0ZW5lcnMuZGVsZXRlKHByb3BlcnR5S2V5KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5saXN0ZW5lcnMuc2V0KHByb3BlcnR5S2V5LCB7IC4uLm9wdGlvbnMgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUHJlcGFyZXMgdGhlIGN1c3RvbSBlbGVtZW50IGNvbnN0cnVjdG9yIGJ5IGluaXRpYWxpemluZyBzdGF0aWMgcHJvcGVydGllcyBmb3IgdGhlIGxpc3RlbmVyIGRlY29yYXRvcixcbiAqIHNvIHdlIGRvbid0IG1vZGlmeSBhIGJhc2UgY2xhc3MncyBzdGF0aWMgcHJvcGVydGllcy5cbiAqXG4gKiBAcmVtYXJrc1xuICogV2hlbiB0aGUgbGlzdGVuZXIgZGVjb3JhdG9yIHN0b3JlcyBsaXN0ZW5lciBkZWNsYXJhdGlvbnMgaW4gdGhlIGNvbnN0cnVjdG9yLCB3ZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGVcbiAqIHN0YXRpYyBsaXN0ZW5lcnMgZmllbGQgaXMgaW5pdGlhbGl6ZWQgb24gdGhlIGN1cnJlbnQgY29uc3RydWN0b3IuIE90aGVyd2lzZSB3ZSBhZGQgbGlzdGVuZXIgZGVjbGFyYXRpb25zXG4gKiB0byB0aGUgYmFzZSBjbGFzcydzIHN0YXRpYyBmaWVsZC4gV2UgYWxzbyBtYWtlIHN1cmUgdG8gaW5pdGlhbGl6ZSB0aGUgbGlzdGVuZXIgbWFwcyB3aXRoIHRoZSB2YWx1ZXMgb2ZcbiAqIHRoZSBiYXNlIGNsYXNzJ3MgbWFwIHRvIHByb3Blcmx5IGluaGVyaXQgYWxsIGxpc3RlbmVyIGRlY2xhcmF0aW9ucy5cbiAqXG4gKiBAcGFyYW0gY29uc3RydWN0b3IgVGhlIGN1c3RvbSBlbGVtZW50IGNvbnN0cnVjdG9yIHRvIHByZXBhcmVcbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHByZXBhcmVDb25zdHJ1Y3RvciAoY29uc3RydWN0b3I6IHR5cGVvZiBDdXN0b21FbGVtZW50KSB7XG5cbiAgICBpZiAoIWNvbnN0cnVjdG9yLmhhc093blByb3BlcnR5KCdsaXN0ZW5lcnMnKSkgY29uc3RydWN0b3IubGlzdGVuZXJzID0gbmV3IE1hcChjb25zdHJ1Y3Rvci5saXN0ZW5lcnMpO1xufVxuIiwiLyoqXG4gKiBHZXQgdGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3J9IG9mIGEgcHJvcGVydHkgZnJvbSBpdHMgcHJvdG90eXBlXG4gKiBvciBhIHBhcmVudCBwcm90b3R5cGUgLSBleGNsdWRpbmcge0BsaW5rIE9iamVjdC5wcm90b3R5cGV9IGl0c2VsZiwgdG9cbiAqIGVuc3VyZSBjb3JyZWN0IHByb3RvdHlwZSBpbmhlcml0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0ICAgICAgICBUaGUgcHJvdG90eXBlIHRvIGdldCB0aGUgZGVzY3JpcHRvciBmcm9tXG4gKiBAcGFyYW0gcHJvcGVydHlLZXkgICBUaGUgcHJvcGVydHkga2V5IGZvciB3aGljaCB0byBnZXQgdGhlIGRlc2NyaXB0b3JcbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wZXJ0eURlc2NyaXB0b3IgKHRhcmdldDogT2JqZWN0LCBwcm9wZXJ0eUtleTogUHJvcGVydHlLZXkpOiBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWQge1xuXG4gICAgaWYgKHByb3BlcnR5S2V5IGluIHRhcmdldCkge1xuXG4gICAgICAgIHdoaWxlICh0YXJnZXQgIT09IE9iamVjdC5wcm90b3R5cGUpIHtcblxuICAgICAgICAgICAgaWYgKHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eUtleSkpIHtcblxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgcHJvcGVydHlLZXkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0YXJnZXQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG4iLCJpbXBvcnQgeyBDdXN0b21FbGVtZW50IH0gZnJvbSAnLi4vY3VzdG9tLWVsZW1lbnQnO1xuaW1wb3J0IHsgZ2V0UHJvcGVydHlEZXNjcmlwdG9yIH0gZnJvbSAnLi9nZXQtcHJvcGVydHktZGVzY3JpcHRvcic7XG5pbXBvcnQgeyBjcmVhdGVBdHRyaWJ1dGVOYW1lLCBERUZBVUxUX1BST1BFUlRZX0RFQ0xBUkFUSU9OLCBQcm9wZXJ0eURlY2xhcmF0aW9uIH0gZnJvbSAnLi9wcm9wZXJ0eS1kZWNsYXJhdGlvbic7XG5cbi8qKlxuICogQSB0eXBlIGV4dGVuc2lvbiB0byBhZGQgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRvIGEge0BsaW5rIEN1c3RvbUVsZW1lbnR9IGNvbnN0cnVjdG9yIGR1cmluZyBkZWNvcmF0aW9uXG4gKlxuICogQGludGVybmFsXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgdHlwZSBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZSA9IHR5cGVvZiBDdXN0b21FbGVtZW50ICYgeyBvdmVycmlkZGVuOiBTZXQ8c3RyaW5nPiB9O1xuXG4vKipcbiAqIERlY29yYXRlcyBhIHtAbGluayBDdXN0b21FbGVtZW50fSBwcm9wZXJ0eVxuICpcbiAqIEByZW1hcmtzXG4gKiBNYW55IG9mIHRoZSB7QGxpbmsgUHJvcGVydHlEZWNsYXJhdGlvbn0gb3B0aW9ucyBzdXBwb3J0IGN1c3RvbSBmdW5jdGlvbnMsIHdoaWNoIHdpbGwgYmUgaW52b2tlZFxuICogd2l0aCB0aGUgY3VzdG9tIGVsZW1lbnQgaW5zdGFuY2UgYXMgYHRoaXNgLWNvbnRleHQgZHVyaW5nIGV4ZWN1dGlvbi4gSW4gb3JkZXIgdG8gc3VwcG9ydCBjb3JyZWN0XG4gKiB0eXBpbmcgaW4gdGhlc2UgZnVuY3Rpb25zLCB0aGUgYEBwcm9wZXJ0eWAgZGVjb3JhdG9yIHN1cHBvcnRzIGdlbmVyaWMgdHlwZXMuIEhlcmUgaXMgYW4gZXhhbXBsZVxuICogb2YgaG93IHlvdSBjYW4gdXNlIHRoaXMgd2l0aCBhIGN1c3RvbSB7QGxpbmsgUHJvcGVydFJlZmxlY3Rvcn06XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY2xhc3MgTXlFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gKlxuICogICAgICBteUhpZGRlblByb3BlcnR5ID0gdHJ1ZTtcbiAqXG4gKiAgICAgIC8vIHVzZSBhIGdlbmVyaWMgdG8gc3VwcG9ydCBwcm9wZXIgaW5zdGFuY2UgdHlwaW5nIGluIHRoZSBwcm9wZXJ0eSByZWZsZWN0b3JcbiAqICAgICAgQHByb3BlcnR5PE15RWxlbWVudD4oe1xuICogICAgICAgICAgcmVmbGVjdFByb3BlcnR5OiAocHJvcGVydHlLZXk6IHN0cmluZywgb2xkVmFsdWU6IGFueSwgbmV3VmFsdWU6IGFueSkge1xuICogICAgICAgICAgICAgIC8vIHRoZSBnZW5lcmljIHR5cGUgYWxsb3dzIGZvciBjb3JyZWN0IHR5cGluZyBvZiB0aGlzXG4gKiAgICAgICAgICAgICAgaWYgKHRoaXMubXlIaWRkZW5Qcm9wZXJ0eSAmJiBuZXdWYWx1ZSkge1xuICogICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnbXktcHJvcGVydHknLCAnJyk7XG4gKiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAqICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ215LXByb3BlcnR5Jyk7XG4gKiAgICAgICAgICAgICAgfVxuICogICAgICAgICAgfVxuICogICAgICB9KVxuICogICAgICBteVByb3BlcnR5ID0gZmFsc2U7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBBIHByb3BlcnR5IGRlY2xhcmF0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBwcm9wZXJ0eSA9IDxUeXBlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCA9IEN1c3RvbUVsZW1lbnQ+IChvcHRpb25zOiBQYXJ0aWFsPFByb3BlcnR5RGVjbGFyYXRpb248VHlwZT4+ID0ge30pID0+IHtcblxuICAgIHJldHVybiAodGFyZ2V0OiBPYmplY3QsIHByb3BlcnR5S2V5OiBQcm9wZXJ0eUtleSk6IHZvaWQgPT4ge1xuXG4gICAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBnZXRQcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBwcm9wZXJ0eUtleSk7XG4gICAgICAgIGNvbnN0IGhpZGRlbktleSA9ICh0eXBlb2YgcHJvcGVydHlLZXkgPT09ICdzdHJpbmcnKSA/IGBfJHsgcHJvcGVydHlLZXkgfWAgOiBTeW1ib2woKTtcbiAgICAgICAgY29uc3QgZ2V0ID0gZGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yLmdldCB8fCBmdW5jdGlvbiAodGhpczogYW55KSB7IHJldHVybiB0aGlzW2hpZGRlbktleV07IH07XG4gICAgICAgIGNvbnN0IHNldCA9IGRlc2NyaXB0b3IgJiYgZGVzY3JpcHRvci5zZXQgfHwgZnVuY3Rpb24gKHRoaXM6IGFueSwgdmFsdWU6IGFueSkgeyB0aGlzW2hpZGRlbktleV0gPSB2YWx1ZTsgfTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGdldCAoKTogYW55IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0LmNhbGwodGhpcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0ICh2YWx1ZTogYW55KTogdm9pZCB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzW3Byb3BlcnR5S2V5XTtcbiAgICAgICAgICAgICAgICBzZXQuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogbWF5YmUgaW52b2tlIHByb3BlcnR5Q2hhbmdlZENhbGxiYWNrIGluc3RlYWQ/XG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0VXBkYXRlKHByb3BlcnR5S2V5LCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjb25zdHJ1Y3RvciA9IHRhcmdldC5jb25zdHJ1Y3RvciBhcyBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZTtcblxuICAgICAgICBjb25zdCBkZWNsYXJhdGlvbjogUHJvcGVydHlEZWNsYXJhdGlvbjxUeXBlPiA9IHsgLi4uREVGQVVMVF9QUk9QRVJUWV9ERUNMQVJBVElPTiwgLi4ub3B0aW9ucyB9O1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIHRoZSBkZWZhdWx0IGF0dHJpYnV0ZSBuYW1lXG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi5hdHRyaWJ1dGUgPT09IHRydWUpIHtcblxuICAgICAgICAgICAgZGVjbGFyYXRpb24uYXR0cmlidXRlID0gY3JlYXRlQXR0cmlidXRlTmFtZShwcm9wZXJ0eUtleSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzZXQgdGhlIGRlZmF1bHQgcHJvcGVydHkgY2hhbmdlIGRldGVjdG9yXG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi5vYnNlcnZlID09PSB0cnVlKSB7XG5cbiAgICAgICAgICAgIGRlY2xhcmF0aW9uLm9ic2VydmUgPSBERUZBVUxUX1BST1BFUlRZX0RFQ0xBUkFUSU9OLm9ic2VydmU7XG4gICAgICAgIH1cblxuICAgICAgICBwcmVwYXJlQ29uc3RydWN0b3IoY29uc3RydWN0b3IpO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHdlIGluaGVyaXRlZCBhbiBvYnNlcnZlZCBhdHRyaWJ1dGUgZm9yIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBiYXNlIGNsYXNzXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGNvbnN0cnVjdG9yLnByb3BlcnRpZXMuaGFzKHByb3BlcnR5S2V5KSA/IGNvbnN0cnVjdG9yLnByb3BlcnRpZXMuZ2V0KHByb3BlcnR5S2V5KSEuYXR0cmlidXRlIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIC8vIGlmIGF0dHJpYnV0ZSBpcyB0cnV0aHkgaXQncyBhIHN0cmluZyBhbmQgaXQgd2lsbCBleGlzdCBpbiB0aGUgYXR0cmlidXRlcyBtYXBcbiAgICAgICAgaWYgKGF0dHJpYnV0ZSkge1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIGluaGVyaXRlZCBhdHRyaWJ1dGUgYXMgaXQncyBvdmVycmlkZGVuXG4gICAgICAgICAgICBjb25zdHJ1Y3Rvci5hdHRyaWJ1dGVzLmRlbGV0ZShhdHRyaWJ1dGUgYXMgc3RyaW5nKTtcblxuICAgICAgICAgICAgLy8gbWFyayBhdHRyaWJ1dGUgYXMgb3ZlcnJpZGRlbiBmb3Ige0BsaW5rIGN1c3RvbUVsZW1lbnR9IGRlY29yYXRvclxuICAgICAgICAgICAgY29uc3RydWN0b3Iub3ZlcnJpZGRlbi5hZGQoYXR0cmlidXRlIGFzIHN0cmluZyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVjbGFyYXRpb24uYXR0cmlidXRlKSB7XG5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yLmF0dHJpYnV0ZXMuc2V0KGRlY2xhcmF0aW9uLmF0dHJpYnV0ZSwgcHJvcGVydHlLZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc3RvcmUgdGhlIHByb3BlcnR5IGRlY2xhcmF0aW9uIGxhc3QsIHNvIHdlIGNhbiBzdGlsbCBhY2Nlc3MgdGhlIGluaGVyaXRlZCBkZWNsYXJhdGlvblxuICAgICAgICAvLyB3aGVuIHByb2Nlc3NpbmcgdGhlIGF0dHJpYnV0ZXNcbiAgICAgICAgY29uc3RydWN0b3IucHJvcGVydGllcy5zZXQocHJvcGVydHlLZXksIGRlY2xhcmF0aW9uIGFzIFByb3BlcnR5RGVjbGFyYXRpb24pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFByZXBhcmVzIHRoZSBjdXN0b20gZWxlbWVudCBjb25zdHJ1Y3RvciBieSBpbml0aWFsaXppbmcgc3RhdGljIHByb3BlcnRpZXMgZm9yIHRoZSBwcm9wZXJ0eSBkZWNvcmF0b3IsXG4gKiBzbyB3ZSBkb24ndCBtb2RpZnkgYSBiYXNlIGNsYXNzJ3Mgc3RhdGljIHByb3BlcnRpZXMuXG4gKlxuICogQHJlbWFya3NcbiAqIFdoZW4gdGhlIHByb3BlcnR5IGRlY29yYXRvciBzdG9yZXMgcHJvcGVydHkgZGVjbGFyYXRpb25zIGFuZCBhdHRyaWJ1dGUgbWFwcGluZ3MgaW4gdGhlIGNvbnN0cnVjdG9yLFxuICogd2UgaGF2ZSB0byBtYWtlIHN1cmUgdGhvc2Ugc3RhdGljIGZpZWxkcyBhcmUgaW5pdGlhbGl6ZWQgb24gdGhlIGN1cnJlbnQgY29uc3RydWN0b3IuIE90aGVyd2lzZSB3ZVxuICogYWRkIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhbmQgYXR0cmlidXRlIG1hcHBpbmdzIHRvIHRoZSBiYXNlIGNsYXNzJ3Mgc3RhdGljIGZpZWxkcy4gV2UgYWxzbyBtYWtlXG4gKiBzdXJlIHRvIGluaXRpYWxpemUgdGhlIGNvbnN0cnVjdG9ycyBtYXBzIHdpdGggdGhlIHZhbHVlcyBvZiB0aGUgYmFzZSBjbGFzcydzIG1hcHMgdG8gcHJvcGVybHlcbiAqIGluaGVyaXQgYWxsIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhbmQgYXR0cmlidXRlcy5cbiAqXG4gKiBAcGFyYW0gY29uc3RydWN0b3IgVGhlIGN1c3RvbSBlbGVtZW50IGNvbnN0cnVjdG9yIHRvIHByZXBhcmVcbiAqXG4gKiBAaW50ZXJuYWxcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHByZXBhcmVDb25zdHJ1Y3RvciAoY29uc3RydWN0b3I6IERlY29yYXRlZEN1c3RvbUVsZW1lbnRUeXBlKSB7XG5cbiAgICAvLyB0aGlzIHdpbGwgZ2l2ZSB1cyBhIGNvbXBpbGUtdGltZSBlcnJvciBpZiB3ZSByZWZhY3RvciBvbmUgb2YgdGhlIHN0YXRpYyBjb25zdHJ1Y3RvciBwcm9wZXJ0aWVzXG4gICAgLy8gYW5kIHdlIHdvbid0IG1pc3MgcmVuYW1pbmcgdGhlIHByb3BlcnR5IGtleXNcbiAgICBjb25zdCBwcm9wZXJ0aWVzOiBrZXlvZiBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZSA9ICdwcm9wZXJ0aWVzJztcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiBrZXlvZiBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZSA9ICdhdHRyaWJ1dGVzJztcbiAgICBjb25zdCBvdmVycmlkZGVuOiBrZXlvZiBEZWNvcmF0ZWRDdXN0b21FbGVtZW50VHlwZSA9ICdvdmVycmlkZGVuJztcblxuICAgIGlmICghY29uc3RydWN0b3IuaGFzT3duUHJvcGVydHkocHJvcGVydGllcykpIGNvbnN0cnVjdG9yLnByb3BlcnRpZXMgPSBuZXcgTWFwKGNvbnN0cnVjdG9yLnByb3BlcnRpZXMpO1xuICAgIGlmICghY29uc3RydWN0b3IuaGFzT3duUHJvcGVydHkoYXR0cmlidXRlcykpIGNvbnN0cnVjdG9yLmF0dHJpYnV0ZXMgPSBuZXcgTWFwKGNvbnN0cnVjdG9yLmF0dHJpYnV0ZXMpO1xuICAgIGlmICghY29uc3RydWN0b3IuaGFzT3duUHJvcGVydHkob3ZlcnJpZGRlbikpIGNvbnN0cnVjdG9yLm92ZXJyaWRkZW4gPSBuZXcgU2V0KCk7XG59XG4iLCJpbXBvcnQgeyBodG1sLCBUZW1wbGF0ZVJlc3VsdCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCB7IEFUVFJJQlVURV9DT05WRVJURVJTLCBjdXN0b21FbGVtZW50LCBDdXN0b21FbGVtZW50LCBsaXN0ZW5lciwgcHJvcGVydHkgfSBmcm9tICcuLi8uLi9zcmMnO1xuXG5AY3VzdG9tRWxlbWVudCh7XG4gICAgc2VsZWN0b3I6ICdjaGVjay1ib3gnXG59KVxuZXhwb3J0IGNsYXNzIENoZWNrYm94IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cbiAgICBAcHJvcGVydHkoKVxuICAgIGN1c3RvbVJvbGUgPSAnY2hlY2tib3gnO1xuXG4gICAgQHByb3BlcnR5PENoZWNrYm94Pih7XG4gICAgICAgIGNvbnZlcnRlcjogQVRUUklCVVRFX0NPTlZFUlRFUlMuYm9vbGVhbixcbiAgICAgICAgcmVmbGVjdFByb3BlcnR5OiAncmVmbGVjdENoZWNrZWQnLFxuICAgICAgICAvLyByZWZsZWN0UHJvcGVydHk6IGZ1bmN0aW9uIChwcm9wZXJ0eUtleTogc3RyaW5nLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG4gICAgICAgIC8vICAgICBpZiAodGhpcy5jdXN0b21DaGVja2VkKSB7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJywgJ3RydWUnKTtcbiAgICAgICAgLy8gICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnYXJpYS1jaGVja2VkJywgJ3RydWUnKTtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJyk7XG4gICAgICAgIC8vICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtY2hlY2tlZCcpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9LFxuICAgICAgICAvLyBub3RpZnk6IHRydWUsXG4gICAgICAgIG5vdGlmeTogJ25vdGlmeUNoZWNrZWQnLFxuICAgICAgICAvLyBub3RpZnk6IGZ1bmN0aW9uIChwcm9wZXJ0eUtleTogc3RyaW5nLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZygnY3VzdG9tIG5vdGlmaWVyLi4uJyk7XG4gICAgICAgIC8vIH1cbiAgICB9KVxuICAgIGN1c3RvbUNoZWNrZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcblxuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIEBsaXN0ZW5lcih7XG4gICAgICAgIGV2ZW50OiAnY2xpY2snXG4gICAgfSlcbiAgICBvbkNsaWNrIChldmVudDogTW91c2VFdmVudCkge1xuXG4gICAgICAgIHRoaXMud2F0Y2goKCkgPT4ge1xuXG4gICAgICAgICAgICB0aGlzLmN1c3RvbUNoZWNrZWQgPSAhdGhpcy5jdXN0b21DaGVja2VkO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyB0aGlzLmN1c3RvbUNoZWNrZWQgPSAhdGhpcy5jdXN0b21DaGVja2VkO1xuXG4gICAgICAgIC8vIHRoaXMubm90aWZ5KCdjdXN0b21DaGVja2VkJyk7XG4gICAgfVxuXG4gICAgcmVmbGVjdENoZWNrZWQgKCkge1xuXG4gICAgICAgIGlmICh0aGlzLmN1c3RvbUNoZWNrZWQpIHtcblxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJywgJycpO1xuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ2FyaWEtY2hlY2tlZCcsICd0cnVlJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUoJ2N1c3RvbS1jaGVja2VkJyk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1jaGVja2VkJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm90aWZ5Q2hlY2tlZCAoKSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coYG5vdGlmeUNoZWNrZWQuLi5gKTtcbiAgICB9XG5cbiAgICB0ZW1wbGF0ZSAoKTogVGVtcGxhdGVSZXN1bHQge1xuXG4gICAgICAgIHJldHVybiBodG1sYFxuICAgICAgICAgICAgPHN0eWxlPlxuICAgICAgICAgICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogMXJlbTtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAxcmVtO1xuICAgICAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjOTk5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6aG9zdChbY3VzdG9tLWNoZWNrZWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNjY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgPC9zdHlsZT5gO1xuICAgIH1cbn1cbiIsImltcG9ydCAnLi9zcmMvY2hlY2tib3gnO1xuXG5mdW5jdGlvbiBib290c3RyYXAgKCkge1xuXG4gICAgY29uc3QgY2hlY2tib3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjaGVjay1ib3gnKTtcblxuICAgIGlmIChjaGVja2JveCkge1xuXG4gICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoZWNrZWQtY2hhbmdlZCcsIGV2ZW50ID0+IGNvbnNvbGUubG9nKChldmVudCBhcyBDdXN0b21FdmVudCkuZGV0YWlsKSk7XG4gICAgfVxufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGJvb3RzdHJhcCk7XG4iXSwibmFtZXMiOlsiZGlyZWN0aXZlIiwicHJlcGFyZUNvbnN0cnVjdG9yIiwidHNsaWJfMS5fX2RlY29yYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsTUFBTSxVQUFVLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNqQyxJQTBC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
