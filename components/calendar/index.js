import React from 'react';
import Day from './day';
import moment from 'moment';

import { API_EVENTS_URL } from '../../common/constants';

require('es6-promise').polyfill();
require('isomorphic-fetch');

const TODAY = moment();

function getActiveEvent (postDays, postEs, active) {
  if (active < 0 && postDays.length > 0) {
    return postDays[0].props.events[0].index;
  } else if (active < 0 && postEs[0]) {
    return postEs[0].index;
  }

  return active;
}

const Calendar = React.createClass({
  getInitialState: function () {
    return {
      active: -1,
      events: [],
      error: null,
      preDaysSectionActive: false
    };
  },

  fetchData: function () {
    var self = this;

    fetch(API_EVENTS_URL, {
      method: 'GET',
      mode: 'cors'
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        self.setState(Object.assign({}, self.state, { events: data.results }));
      })
      .catch(function (error) {
        self.setState(Object.assign({}, self.state, { error: error }));
      });
  },

  eventClickHandler: function (id) {
    this.setState(Object.assign({}, this.state, { active: id }));
    setTimeout(function () {
      window.location = `#event-${id}`;
    }, 0);
  },

  preDaysClickHandler: function () {
    this.setState(Object.assign({}, this.state, { preDaysSectionActive: !this.state.preDaysSectionActive }));
  },

  partitionEvents: function (preEs, postEs, active) {
    let preDay, postDay;

    if (preEs.length) {
      preDay = <Day events={preEs} active={active} eventClickHandler={this.eventClickHandler}/>;
    }
    if (postEs.length) {
      postDay = <Day events={postEs} active={active} eventClickHandler={this.eventClickHandler}/>;
    }

    return {
      preDay: preDay,
      postDay: postDay
    };
  },

  buildEvents: function (events) {
    let id = 0;
    let previousEventDate;

    let preEs = [];
    let postEs = [];

    let preDays = [];
    let postDays = [];
    let preDaysSection = '';
    let toggleCalendarSection = '';

    events.forEach(function (event, index) {
      event.index = index;
      const currentEventDate = moment(event.end_time);

      if (currentEventDate.isAfter(previousEventDate, 'day')) {
        const active = getActiveEvent(postDays, postEs, this.state.active);
        const { preDay, postDay } = this.partitionEvents(preEs, postEs, active);

        if (preDay) {
          preDays.push(preDay);
        }
        if (postDay) {
          postDays.push(postDay);
        }

        preEs = [];
        postEs = [];
      }
      if (currentEventDate.isBefore(TODAY)) {
        preEs.push(event);
      }
      else {
        postEs.push(event);
      }

      previousEventDate = currentEventDate;
      id++;
    }, this);

    const active = getActiveEvent(postDays, postEs, this.state.active);
    const { preDay, postDay } = this.partitionEvents(preEs, postEs, active);
    if (preDay) {
      preDays.push(preDay);
    }
    if (postDay) {
      postDays.push(postDay);
    }

    if (preDays.length > 0 && this.state.preDaysSectionActive) {
      preDaysSection = (
        <div className="cal-section--preDays">
          { preDays }
        </div>
      );
      toggleCalendarSection = (
        <button className="cal-button--preDays" onClick={this.preDaysClickHandler}>
          Skjul tidligere arrangementer
        </button>
      );
    }
    else if (preDays.length > 0 && !this.state.preDaysSectionActive) {
      toggleCalendarSection = (
        <button className="cal-button--preDays" onClick={this.preDaysClickHandler}>Vis tidligere arrangementer</button>
      );
    }
    else {
      preDaysSection = '';
    }

    return {
      postDaysSection: postDays,
      toggleCalendarSection: toggleCalendarSection,
      preDaysSection: preDaysSection
    };
  },

  render: function () {
    let calendarContent = '';

    if (this.state.events.length === 0 && this.state.error === null) {
      this.fetchData();
      calendarContent = (<h2 className="component">Laster inn kalender</h2>);
    }
    else if (this.state.error !== null) {
      calendarContent = (
        <p className="component">En uventet feil har oppstått ved henting av program. Vennligst prøv igjen senere.</p>
      );
    }
    else {
      let { postDaysSection, toggleCalendarSection, preDaysSection } = this.buildEvents(this.state.events);

      calendarContent = (
        <div>
          <div className="cal-timeline"/>

          { preDaysSection }
          { toggleCalendarSection }
          { postDaysSection }
        </div>
      );
    }

    return (
      <section id="calendar" className="component">
        <h1>Program. <a href="https://online.ntnu.no/splash/events.ics">iCalendar</a></h1>

        { calendarContent }
      </section>
    );
  }
});

export default Calendar;
