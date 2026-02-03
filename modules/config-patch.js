export class WH4FRPatchConfig {
  /************************************************************************************/
  static translateSkillList(skillList) {
    let compendiumName = "wfrp4e-core.items";

    let newList = [];
    for (let compName of skillList) {
      if (!compName) {
        newList.push(compName);
        continue;
      }
      if (!isNaN(compName)) {
        // If numeric, keep as is (for skill levels)
        newList.push(compName);
        continue;
      }
      // Trim compName
      compName = compName.trim();
      let special = "";
      let newName = compName;
      let baseName = compName;
      if (compName.includes("(") && compName.includes(")")) {
        // Then process specific skills name with (xxxx) inside
        let re = /(.*) +\((.*)\)/i;
        let res = re.exec(compName);
        compName = res[1].trim(); // Get the root skill name
        special = " (" + game.i18n.localize(res[2].trim()) + ")"; // And the special keyword
      }
      let compNameFR = game.babele.translate(
        compendiumName,
        { name: compName },
        true,
      );
      if (compNameFR.name != compName) {
        // Translation OK
        newName = compNameFR.name + special;
      }
      // DEBUG console.log("Translating skill ", compName, baseName, " to ", newName, special);
      if (
        !newName ||
        newName == "" ||
        newName === undefined ||
        newName === "undefined"
      ) {
        // If no translation, keep the original name
        newName = baseName; // If no translation, keep the original name
      }
      newList.push(newName);
    }
    return newList;
  }

  /************************************************************************************/
  static translateTalentList(talentList) {
    let compendiumName = "wfrp4e-core.items";

    let newList = [];
    for (let talentLine of talentList) {
      let special = "";
      let newName = talentLine;
      if (isNaN(talentLine)) {
        let subList = talentLine.split(",");
        let newSubList = [];
        for (let talentName of subList) {
          talentName = talentName.trim();
          let newName2 = talentName;
          if (talentName.includes("(") && talentName.includes(")")) {
            // Then process specific skills name with (xxxx) inside
            let re = /(.*) +\((.*)\)/i;
            let res = re.exec(talentName);
            talentName = res[1].trim(); // Get the root skill name
            special = " (" + game.i18n.localize(res[2].trim()) + ")"; // And the special keyword
          }
          let talentNameFR = game.babele.translate(
            compendiumName,
            { name: talentName },
            true,
          );
          if (talentNameFR.name != talentName) {
            // Translation OK
            newName2 = talentNameFR.name + special;
          }
          newSubList.push(newName2);
        }
        newName = newSubList.join(", ");
      }
      newList.push(newName);
    }
    return newList;
  }

  /************************************************************************************/
  static patch_subspecies() {
    for (let speciesName in game.wfrp4e.config.subspecies) {
      let subspeciesList = game.wfrp4e.config.subspecies[speciesName];
      for (let subspeciesName in subspeciesList) {
        let subspecies = subspeciesList[subspeciesName];
        if (subspecies.skills) {
          subspecies.skills = this.translateSkillList(subspecies.skills);
        }
        if (subspecies.talents) {
          subspecies.talents = this.translateTalentList(subspecies.talents);
        }
      }
    }
  }

  /************************************************************************************/
  static patch_species_skills() {
    console.log("Patching species skills....");
    for (let speciesName in game.wfrp4e.config.speciesSkills) {
      let speciesComp = game.wfrp4e.config.speciesSkills[speciesName];
      console.log("SpeciesName", speciesName, speciesComp);
      game.wfrp4e.config.speciesSkills[speciesName] =
        this.translateSkillList(speciesComp);
    }
  }

  /************************************************************************************/
  static patch_species_talents() {
    for (let speciesName in game.wfrp4e.config.speciesTalents) {
      let speciesTalents = game.wfrp4e.config.speciesTalents[speciesName];
      game.wfrp4e.config.speciesTalents[speciesName] =
        this.translateTalentList(speciesTalents);
    }
  }

  /************************************************************************************/
  static patch_career() {
    let compendiumName = "wfrp4e-core.items";

    if (game.wfrp4e.tables.career) {
      for (let row of game.wfrp4e.tables.career.rows) {
        for (let key in row) {
          if (key != "range") {
            if (row[key].name == "Slayer") {
              row[key].name = "Tueur Nains";
            } else if (row[key].name == "Duelist") {
              row[key].name = "Duelliste";
            } else {
              let career_fr = game.babele.translate(
                compendiumName,
                { name: row[key].name },
                true,
              );
              row[key].name = career_fr.name;
            }
          }
        }
      }
    }
  }

  /************************************************************************************/
  static fixSpeciesTable() {
    let speciesTable = game.wfrp4e.tables.findTable("species");
    let newResults = foundry.utils.duplicate(speciesTable.results);
    for (let result of newResults) {
      result.name = game.i18n.localize(result.name);
    }
    speciesTable.update({ results: newResults });
    console.log(
      "Species table patched to use 'Humain' instead of 'Human'",
      speciesTable,
    );
  }

  /************************************************************************************/
  static perform_patch() {
    if (game.user.isGM) {
      let coreC7 = game.modules.find((mod) => mod.id == "wfrp4e-core");
      if (!coreC7?.active) {
        ui.notifications.warn(
          "Non hai attivato il modulo CoreC7! La traduzione sarà quindi incompleta e non operativa.",
        );
        return;
      }
    }

    // Detect and patch as necessary
    if (game.wfrp4e.config?.talentBonuses) {
      this.fixSpeciesTable(); // Force 'name' field replacement

      game.wfrp4e.config.qualityDescriptions["distract"] = game.i18n.localize(
        "WFRP4E.Properties.Distract",
      ); // Patch missing quality

      game.wfrp4e.config.talentBonuses = {
        perspicace: "int",
        affable: "fel",
        "tireur de précision": "bs",
        "très fort": "s",
        vivacité: "i",
        "reflexes foudroyants": "ag",
        imperturbable: "wp",
        "très résistant": "t",
        "doigts de fée": "dex",
        "guerrier né": "ws",
      };

      if (game.wfrp4e.config.loreEffects) {
        game.wfrp4e.config.loreEffects["beasts"].label = "Domaine des Bêtes";
        game.wfrp4e.config.loreEffects["death"].label = "Domaine de la Mort";
        game.wfrp4e.config.loreEffects["fire"].label = "Domaine du Feu";
        game.wfrp4e.config.loreEffects["metal"].label = "Domaine du Métal";
        game.wfrp4e.config.loreEffects["heavens"].label = "Domaine des Cieux";
        game.wfrp4e.config.loreEffects["life"].label = "Domaine de la Vie";
        game.wfrp4e.config.loreEffects["light"].label = "Domaine de la Lumière";
        game.wfrp4e.config.loreEffects["shadow"].label = "Domaine des Ombres";
        game.wfrp4e.config.loreEffects["hedgecraft"].label =
          "Domaine de la Magie de Village";
        game.wfrp4e.config.loreEffects["hedgecraft"].label =
          "Domaine de la Sorcellerie";
      }

      if (game.wfrp4e.config.species) {
        game.wfrp4e.config.species["human"] = "Umano";
        game.wfrp4e.config.species["dwarf"] = "Nano";
        game.wfrp4e.config.species["halfling"] = "Halfling";
        game.wfrp4e.config.species["helf"] = "Alto Elfo";
        game.wfrp4e.config.species["welf"] = "Elfo Silvano";
      }

      if (game.wfrp4e.config.characteristicsBonus) {
        game.wfrp4e.config.characteristicsBonus = {
          ws: "Bonus de Capacité de Combat",
          bs: "Bonus de Capacité de Tir",
          s: "Bonus de Force",
          t: "Bonus d'Endurance",
          i: "Bonus d'Initiative",
          ag: "Bonus d'Agilité",
          dex: "Bonus de Dexterité",
          int: "Bonus d'Intelligence",
          wp: "Bonus de Force Mentale",
          fel: "Bonus de Sociabilité",
        };
      }

      if (game.wfrp4e.config.classTrappings) {
        for (const c of Object.keys(game.wfrp4e.config.classTrappings)) {
          game.wfrp4e.config.classTrappings[game.i18n.localize(c)] =
            game.wfrp4e.config.classTrappings[c];
        }
      }

      this.patch_species_skills();
      this.patch_species_talents();
      this.patch_subspecies();
      this.patch_career();

      game.wfrp4e.config.symptomEffects = {
        blight: {
          label: "Toxine",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "invoke",
              symptom: true,
              script: `
                        let difficulty = ""
                        if (this.effect.label.includes("Modéré"))
                            difficulty = "easy"
                        else if (this.effect.label.includes("Sévère"))
                            difficulty = "average"
                        else
                            difficulty = "veasy"

                        if (args.actor.isOwner)
                        {
                            args.actor.setupSkill("Résistance", {absolute: {difficulty}}).then(setupData => {
                                args.actor.basicTest(setupData).then(test =>
                                    {
                                        if (test.result.outcome == "failure")
                                            args.actor.addCondition("dead")
                                    })
                                })
                        }`,
            },
          },
        },
        buboes: {
          label: "Bubons",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "prefillDialog",
              symptom: true,
              script: `
                    let applicableCharacteristics = ["ws", "bs", "s", "fel", "ag", "t", "dex"]
                    if (args.type == "weapon")
                        args.prefillModifiers.modifier -= 10
                    else if (args.type == "characteristic")
                    {
                        if (applicableCharacteristics.includes(args.item))
                            args.prefillModifiers.modifier -= 10
                    }
                    else if (args.type == "skill")
                    {
                        if (applicableCharacteristics.includes(args.item.characteristic.value))
                            args.prefillModifiers.modifier -= 10
                    }
            `,
            },
          },
        },
        convulsions: {
          label: "Convulsions",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "prefillDialog",
              symptom: true,
              script: `
                        let modifier = 0
                        if (this.effect.label.includes("Modéré"))
                            modifier = -20
                        else
                            modifier = -10

                        let applicableCharacteristics = ["ws", "bs", "s", "ag", "t", "dex"]
                        if (args.type == "weapon")
                            args.prefillModifiers.modifier += modifier
                        else if (args.type == "characteristic")
                        {
                            if (applicableCharacteristics.includes(args.item))
                                args.prefillModifiers.modifier += modifier
                        }
                        else if (args.type == "skill")
                        {
                            if (applicableCharacteristics.includes(args.item.characteristic.value))
                                args.prefillModifiers.modifier += modifier
                        }
                    }`,
            },
          },
        },
        fever: {
          label: "Fièvre",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "prefillDialog",
              symptom: true,
              script: `

                    let applicableCharacteristics = ["ws", "bs", "s", "fel", "ag", "t", "dex"]

                    if (args.type == "weapon")
                        args.prefillModifiers.modifier -= 10
                    else if (args.type == "characteristic")
                    {
                        if (applicableCharacteristics.includes(args.item))
                            args.prefillModifiers.modifier -= 10
                    }
                    else if (args.type == "skill")
                    {
                        if (applicableCharacteristics.includes(args.item.characteristic.value))
                            args.prefillModifiers.modifier -= 10
                    }`,
              otherEffects: ["blight", "wounded"],
            },
          },
        },
        flux: {
          label: "Intoxication Alimentaire",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              symptom: true,
            },
          },
        },
        lingering: {
          label: "Persistant",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              symptom: true,
            },
          },
        },
        coughsAndSneezes: {
          label: "Toux et éternuements",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              symptom: true,
            },
          },
        },
        gangrene: {
          label: "Gangrène",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "prefillDialog",
              symptom: true,
              script: `
                        if (args.type == "characteristic" && args.item == "fel")
                        {
                            if (args.item == "fel")
                                args.prefillModifiers.modifier -= 10
                        }
                        else if (args.type == "skill")
                        {
                            if (args.item.characteristic.value == "fel")
                                args.prefillModifiers.modifier -= 10
                        }
                    }`,
            },
          },
        },
        malaise: {
          label: "Malaise",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "prepareData",
              symptom: true,
              script: `
                    if (game.user.isUniqueGM)
                    {
                        let fatigued = args.actor.hasCondition("fatigued")
                        if (!fatigued)
                        {
                            args.actor.addCondition("fatigued")
                            ui.notifications.notify("Etat Extenué ajouté à " + args.actor.name + ", qui ne peut pas être enlevé tant que le symptôme Malaise est présent.")
                        }
                    }
                    `,
            },
          },
        },
        nausea: {
          label: "Nausée",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "rollTest",
              symptom: true,
              script: `
                    if (this.actor.isOwner && args.test.result.outcome == "failure")
                    {
                        let applicableCharacteristics = ["ws", "bs", "s", "fel", "ag", "t", "dex"]
                        if (applicableCharacteristics.includes(args.test.result.characteristic))
                            this.actor.addCondition("stunned")
                        else if (args.test.result.skill && applicableCharacteristics.includes(args.test.result.skill.system.characteristic.value))
                            this.actor.addCondition("stunned")
                        else if (args.test.result.weapon)
                            this.actor.addCondition("stunned")

                    }
                    `,
            },
          },
        },
        pox: {
          label: "Démangeaisons",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "prefillDialog",
              symptom: true,
              script: `

                        if (args.type == "characteristic" && args.item == "fel")
                                args.prefillModifiers.modifier -= 10
                        else if (args.type == "skill")
                        {
                            if (args.item.characteristic.value == "fel")
                                args.prefillModifiers.modifier -= 10
                        }
                    }`,
            },
          },
        },
        wounded: {
          label: "Blessé",
          icon: "modules/wfrp4e-core/icons/diseases/disease.png",
          transfer: true,
          flags: {
            wfrp4e: {
              effectApplication: "actor",
              effectTrigger: "invoke",
              symptom: true,
              script: `
                        if (args.actor.isOwner)
                        {
                            args.actor.setupSkill("Résistance", {absolute: {difficulty : "average"}}).then(setupData => {
                                args.actor.basicTest(setupData).then(test =>
                                    {
                                        if (test.result.outcome == "failure")
                                            fromUuid("Compendium.wfrp4e-core.diseases.kKccDTGzWzSXCBOb").then(disease => {
                                                args.actor.createEmbeddedDocuments("Item", [disease.toObject()])
                                            })
                                    })
                                })
                        }`,
            },
          },
        },
      };

      game.wfrp4e.config.effectApplication = {
        actor: "Acteur",
        equipped: "Lorsque l'item est équipé",
        apply: "Apliqué lorsqu'une cible est présente",
        damage: "Apliqué lorsqu'un Item fait des dégâts",
      };

      game.wfrp4e.config.applyScope = {
        actor: "Acteur",
        item: "Item",
      };

      game.wfrp4e.config.effectTriggers = {
        invoke: "Appliqué manuellement",
        oneTime: "Immediat",
        dialogChoice: "Choix par un Dialogue",
        prefillDialog: "Dialogue pré-remplie",
        prePrepareData: "Pré-Préparation des données",
        prePrepareItems: "Pré-préparation des Items d'Acteurs",
        prepareData: "Préparation des données",
        preWoundCalc: "Avant le calcul des Blessures",
        woundCalc: "Calcul des Blessures",
        preApplyDamage: "Avant l'application des Dégâts",
        applyDamage: "Application des Dégâts",
        preTakeDamage: "Avant de prendre les Dégâts",
        takeDamage: "Prise des Dégâts",
        preApplyCondition: "Avant l'application d'un Etat",
        applyCondition: "Application d'Etat",
        prePrepareItem: "Avant la préparation d'un Item",
        prepareItem: "Préparation d'Item",
        preRollTest: "Avant le lancement du Test",
        preRollWeaponTest: "Avant le lancement d'un Test d'Arme",
        preRollCastTest: "Avant le lancement d'un Test d'Incantation",
        preChannellingTest: "Avant le lancement d'un Test de Focalisation",
        preRollPrayerTest: "Avant le lancement d'un Test de Prière",
        preRollTraitTest: "Avant le lancement d'un Test de Trait",
        rollTest: "Lancement du Test",
        rollIncomeTest: "Lancement d'un Test de Revenu",
        rollWeaponTest: "Lancement d'un Test d'Arme",
        rollCastTest: "Lancement d'un Test d'Incantation",
        rollChannellingTest: "Lancement d'un Test de Focalisation",
        rollPrayerTest: "Lancement d'un Test de Prière",
        rollTraitTest: "Lancement d'un Test de Trait",
        preOpposedAttacker: "Avant l'opposition de l'Attaquant",
        preOpposedDefender: "Avant l'opposition du Défenseur",
        opposedAttacker: "Opposition de l'Attaquant",
        opposedDefender: "Opposition du Défenseur",
        calculateOpposedDamage: "Calcul des Dếgats suite au Test Opposé",
        targetPrefillDialog: "Pré-remplir le dialogue de la cible",
        getInitiativeFormula: "Initiative",
        endTurn: "Fin du Tour",
        endRound: "Fin du Round",
        endCombat: "Fin du Combat",
      };

      game.wfrp4e.config.effectPlaceholder = {
        invoke: `Cet effet est uniquement appliqué lorsque le bouton "Appliquer" est cliqué.
        args:

        none`,
        oneTime: `Cet effet s'applique une seule fois, lorsqu'il s'applique.
        args:

        actor : l'acteur qui possède l'effet
        `,
        prefillDialog: `Cet effet s'applique avant d'afficher la fenêtre de Lancer et est destiné à changer les valeurs pré-chargées dans la section des bonus/malus.
        args:

        prefillModifiers : {modifier, difficulty, slBonus, successBonus}
        type: string, 'weapon', 'skill' 'characteristic', etc.
        item: l'objet du type sus-mentionné
        options: Autres détails à propos du test (options.rest ou options.mutate par exemple)

        Exemple:
        if (args.type == "skill" && args.item.name == "Atléthisme") args.prefillModifiers.modifier += 10`,

        prePrepareData: `Cet effet est appliqué avant le calcul des paramètres et données de l'acteur.
        args:

        actor : actor who owns the effect
        `,

        prePrepareItems: `Cet effet est appliqué avant que les Items soient triés et traités.

        actor : l'acteur qui possède l'effet
        `,

        prepareData: `Cet effet est appliqué avant le calcul des paramètres et données de l'acteur.

        args:

        actor : l'acteur qui possède l'effet
        `,

        preWoundCalc: `Cet effet est apliqué juste avant le calcul des blessures, idéal pour échanger des caractéristiues ou ajouter des multiplicateurs.

        actor :  l'acteur qui possède l'effet
        sb : Bonus de Force
        tb : Bonus d'Endurance
        wpb : Bonus de FM
        multiplier : {
            sb : Multiplicateur du SB
            tb : Multiplicateur du TB
            wpb : Multiplicateur du WPB
        }

        e.g. pour Dur à Cuire: "args.multiplier.tb += 1"
        `,

        woundCalc: `Cet effet s'applique après le calcul des Blessures, idéal pour mutiplier le résultat.

        args:

        actor : l'acteur qui possède l'effet
        wounds : les blessures calculées

        e.g. pour Nuée: "wounds *= 5"
        `,

        preApplyDamage: `Cet effet s'applique avant d'appliquer les dégats durant un Test Opposé

        args:

        actor : l'acteur qui encaisse les dégâts
        attacker : l'acteur qui porte l'attaque
        opposedTest : l'objet qui détaille le Test Opposé
        damageType : le type de dégâts sélectionné (ignorer le Bonus d'Endurance, les PA, etc...)
        `,
        applyDamage: `Cet effet s'applique après que les dégâts aient été calculés lors d'un Test Opposé, mais avant que les dêgats soient appliqués sur l'acteur.

        args:

        actor : l'acteur qui encaisse les dégâts
        attacker : l'acteur qui porte l'attaque
        opposedTest : l'objet qui détaille le Test Opposé
        damageType : le type de dégâts sélectionné (ignorer le Bonus d'Endurance, les PA, etc...)
        totalWoundLoss : les Blessures perdues après calculs
        AP : les données concernant les PA utilisés
        updateMsg : le début de la chaîne de caractère pour le message d'information
        messageElements : un tableau de chaîne de caractères listant comment et pourquoi les dommages ont été modifiés
        `,

        preTakeDamage: `Cet effet s'applique avant d'encaisser les dommages d'un Test Opposé

        args:

        actor :  l'acteur qui encaisse les dégâts
        attacker : l'acteur qui porte l'attaque
        opposedTest : l'objet qui détaille le Test Opposé
        damageType : le type de dégâts sélectionné (ignorer le Bonus d'Endurance, les PA, etc...)
        `,

        takeDamage: `Cet effet s'applique après le calcul des dommages d'un Test Opposé, mais avant que l'acteur ne les encaisse.

        args:

        actor : l'acteur qui encaisse les dégâts
        attacker : l'acteur qui porte l'attaque
        opposedTest : l'objet qui détaille le Test Opposé
        damageType : le type de dégâts sélectionné (ignorer le Bonus d'Endurance, les PA, etc...)
        totalWoundLoss : les Blessures perdues après calculs
        AP : les données concernant les PA utilisés
        updateMsg : le début de la chaîne de caractère pour le message d'information
        messageElements : un tableau de chaîne de caractères listant comment et pourquoi les dommages ont été modifiés
        `,

        preApplyCondition: `Cet effet s'applique avant qu'un état ne s'applique.

        args:

        effect : l'état à appliquer
        data : {
            msg : Le message de tchat à propos de l'application de l'Etat
            <autres données, selon l'état>
        }
        `,

        applyCondition: `Cette effet s'applique après que les effets d'un état aient été appliqués.

        args:

        effect : l'état à appliquer
        data : {
            messageData : Le message de tchat à propos de l'application de l'Etat
            <autres données, selon l'état>
        }
        `,
        prePrepareItem: `Cet effet est appliqué avant qu'un item soit traité lors de la phase de clacul des données d'acteur.

        args:

        item : l'item à traité
        `,
        prepareItem: `Cet effet est appliqué après qu'un item soit traité lors de la phase de clacul des données d'acteur.

        args:

        item : l'item traité
        `,
        preRollTest: `Cet effet est appliqué avant qu'un Test sois calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,
        preRollWeaponTest: `Cett effet s'applique avant que le résultat du test d'arme soit calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        preRollCastTest: `Cet effet est appliqué avant que le test d'Incantation soit calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        preChannellingTest: `Cet effet s'applique avant que le Test de Focalisation soit calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        preRollPrayerTest: `Cet effet est appliqué avant qu'un Test de Prière soit appliqué.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        preRollTraitTest: `Cet effet s'applique avant qu'un Trait soit calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        rollTest: `Cet effet s'applique après qu'un Test sois calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,
        rollIncomeTest: `Cet effet s'applique après qu'un test de revenu soit effectué.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        rollWeaponTest: `Cet effet s'applique après qu'un Test d'Arme soit calculé.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        rollCastTest: `Cet effet s'applique après le calcul du Test d'Incantation.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        rollChannellingTest: `Cet effet s'applique après le calcul du Test de Focalisation.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        rollPrayerTest: `Cet effet s'applique après le calcul du Test de Prière.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        rollTraitTest: `Cet effet s'applique après le calcul du Test de Trait.

        args:

        test: Toutes les donnnées pour évaluer le résultat du test
        cardOptions: Les données pour l'affichage dans le Tchat (titre, template, etc)
        `,

        preOpposedAttacker: `Cet effet s'applique avant le calcul du résultat d'un Test Opposé, en tant qu'attaquant.

        args:

        attackerTest: le résultat du test de l'attaquant
        defenderTest: le résultat du test du défenseur
        opposedTest.result: l'objet opposedTest.result, avant calcul
        `,
        preOpposedDefender: `Cet effet s'applique avant le calcul du résultat d'un Test Opposé, en tant que défenseur.

        args:

        attackerTest: le résultat du test de l'attaquant
        defenderTest: le résultat du test du défenseur
        opposedTest.result: l'objet opposedTest.result, avant calcul
        `,

        opposedAttacker: `Cet effet s'applique après le calcul du résultat d'un Test Opposé, en tant qu'attaquant.

        args:

        attackerTest: le résultat du test de l'attaquant
        defenderTest: le résultat du test du défenseur
        opposedTest.result: l'objet opposedTest.result, avant calcul
        `,

        opposedDefender: `Cet effet s'applique après le calcul du résultat d'un Test Opposé, en tant que défenseur.

        args:

        attackerTest: le résultat du test de l'attaquant
        defenderTest: le résultat du test du défenseur
        opposedTest.result: l'objet opposedTest.result, avant calcul
        `,

        calculateOpposedDamage: `Cet effet s'applique durant les calculs de dégâts d'un Test Opposé. Cet effect est effectué dans le contexte de l'acteur attaquant.

        args:

        damage : calcul initial des dégâts avant multiplications
        damageMultiplier : facteur mutiplicateur basé sur la différence de taille
        sizeDiff : la différence numérique en taille, sera utilisé pour ajouter les dégâts/impact
        opposedTest.result: détail à propos du Test Opposé
        `,

        getInitiativeFormula: `Cet effect s'applque lors de la détermination de l'initiative.

        args:

        initiative: Valeur d'intiative calculée
        `,

        targetPrefillDialog: `Cet effet est appliqué sur un autre acteur, même si la cible initiale est un acteur, et est destiné à changer les valeurs pré-remplies dans la section des bonus/malus
        args:

        prefillModifiers : {modifier, difficulty, slBonus, successBonus}
        type: string, 'weapon', 'skill' 'characteristic', etc.
        item: l'item du type sus-mentionné
        options: autres détails à propos du test (options.rest ou options.mutate par exemple)

        Example:
        if (args.type == "skill" && args.item.name == "Atléthisme") args.prefillModifiers.modifier += 10`,

        endTurn: `Cet effet s'applique à la fin du tour de l'acteur

        args:

        combat: combat actuel
        `,

        endRound: `Cet effet s'execute à la fin du round.

        args:

        combat: combat actuel
        `,
        endCombat: `Cet effet s'applique lorsque le combat se termine

        args:

        combat: combat actuel
        `,

        this: `

        Tout les effets ont accès à :
            this.actor : l'acteur executant l'effet
            this.effect : l'effet à executer
            this.item : l'item qui possède l'effet, si l'effet vient d'un item`,
      };
    }
  }

  /************************************************************************************/
  static perform_ogrekingdom_patch() {
    WFRP4E.speciesSkills["ogre"] = [
      "Résistance à l'alcool",
      "Calme",
      "Résistance",
      "Pari",
      "Intimidation",
      "Langue (Au choix)",
      "Langue (Grumbarth)",
      "Langue (Mootland)",
      "Savoir (Ogres)",
      "Corps à corps (Base)",
      "Corps à corps  (Bagarre)",
      "Métier (Cuisiner)",
    ];

    WFRP4E.speciesTalents["ogre"] = [
      "Sens aiguisé (Odorat), Sens aiguisé (Goût)",
      "Résistance (Mutation), Obstiné",
      "Vision nocturne",
      "Très résistant, Très fort",
      "Seconde vue, Sixième sens",
      "Trait - Morsure",
      "Trait - Taille (Grande)",
      "Psychologie - Faim d'Ogre",
      "Psychologie - Met favori (Cible)",
      "Trait de tribu d'ogre (Au choix)",
      0,
    ];
  }
}
