import Rule from './Rule';

export default class ProjectConfig {
  constructor(config) {
    Object.assign(this, config);

    this.entities = this.entities.slice();
    this.lists = this.lists.slice();
    this.expeditionMetadataProperties = this.expeditionMetadataProperties.slice();

    this.entities.forEach(e => {
      e.rules = e.rules.map(r => new Rule(r));
    });
  }

  worksheets() {
    // we don't want to compare the $worksheets variable when determining if 2 configs are the same
    // using angular.equals(); By prefixing the variable with "$", angular will ignore this property
    // during comparison
    if (!this.$worksheets) {
      const worksheets = new Set();
      this.entities
        .filter(e => e.worksheet)
        .forEach(e => worksheets.add(e.worksheet));
      this.$worksheets = Array.from(worksheets);
    }

    return this.$worksheets;
  }

  addWorksheet(sheetName) {
    this.worksheets().push(sheetName);
  }

  attributesByGroup(sheetName) {
    const defaultGroup = 'Default Group';

    const attributes = {};
    attributes[defaultGroup] = [];

    this.entities.filter(entity => entity.worksheet === sheetName).forEach(e =>
      e.attributes.forEach(attribute => {
        const group = attribute.group || defaultGroup;

        if (!(group in attributes)) {
          attributes[group] = [];
        }

        attributes[group].push(attribute);
      }),
    );

    return attributes;
  }

  findAttributesByDefinition(sheetName, def) {
    return this.entities
      .filter(entity => entity.worksheet === sheetName)
      .map(e => e.attributes.filter(a => a.defined_by === def));
  }

  findListForColumn(entity, column) {
    const r = entity.rules.some(
      rule => rule.name === 'ControlledVocabulary' && rule.column === column,
    );
    return r ? this.getList(r.listName) : undefined;
  }

  attributeRules(sheetName, attribute) {
    const reservedKeys = ['name', 'level', 'listName'];
    const sheetRules = this.sheetRules(sheetName);
    const attrRules = [];

    sheetRules.forEach(rule =>
      Object.keys(rule).forEach(k => {
        // if this is not a reservedKey, then check the val for the attribute.column
        if (!reservedKeys.includes(k)) {
          const val = rule[k];
          if (
            (Array.isArray(val) && val.includes(attribute.column)) ||
            attribute.column === val
          ) {
            attrRules.push(rule);
          }
        }
      }),
    );

    return attrRules;
  }

  sheetRules(sheetName) {
    return this.entities.reduce((result, entity) => {
      if (entity.worksheet === sheetName) {
        result.push(...entity.rules);
      }

      return result;
    }, []);
  }

  entityUniqueKey(conceptAlias) {
    const entity = this.entities.find(e => e.conceptAlias === conceptAlias);
    return entity ? entity.uniqueKey : undefined;
  }

  getList(listName) {
    const list = this.lists.find(l => l.alias === listName);
    return list || {};
  }

  getRule(conceptAlias, ruleName, level) {
    const entity = this.entities.find(e => e.conceptAlias === conceptAlias);

    if (entity) {
      let rule = entity.rules.find(
        r => r.name === ruleName && r.level === level,
      );

      if (!rule) {
        rule = Rule.newRule(ruleName);
        rule.level = level;
        entity.rules.push(rule);
      }

      return rule;
    }
  }

  requiredAttributes(sheetName) {
    return this._requiredValueAttributes(sheetName, 'ERROR');
  }

  suggestedAttributes(sheetName) {
    return this._requiredValueAttributes(sheetName, 'WARNING');
  }

  _requiredValueAttributes(sheetName, level) {
    return this.entities
      .filter(e => e.worksheet === sheetName)
      .map(e => {
        const requiredColumns = e.rules
          .filter(r => r.name === 'RequiredValue' && r.level === level)
          .map(r => r.columns)
          .reduce((result, c) => result.concat(c), []);

        return e.attributes.filter(a => requiredColumns.includes(a.column));
      })
      .reduce((result, attributes) => result.concat(attributes), []);
  }
}
