import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'underscore';
import * as moment from 'moment';
import { ChallengeService } from './challenge.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {

  workouts = [];
  workoutLogs;
  userWorkoutLogs = {};
  users = [];
  challengeId;
  challenge;
  allUsers;
  workoutsLoaded = false;

  constructor(
    public db: AngularFirestore,
    private activatedRoute: ActivatedRoute,
    private challengeService: ChallengeService,
    private userService: UserService
    ) {
      this.activatedRoute.queryParams.subscribe(params => {
        if (this.challengeId !== params['challengeId']) {
          this.challengeId = params['challengeId'] ? parseInt(params['challengeId']) : "";
          this.getAllWorkouts();
        }
      });
    }

  getInitData() {
    return new Promise<any>((resolve, reject) => {
      if (!_.isEmpty(this.workouts)) { resolve(this.workouts); }
      this.db.collection('workouts').valueChanges().subscribe((items) => {
        this.workouts = items;
        this.challengeService.getChallengeAsync(this.challengeId).then((challenge:any) => {
          this.challenge = challenge;
          this.userService.getUsers().then((users) => {
            this.allUsers = users;
            resolve();
          });
        });
      })
    });
  }

  saveWorkout(data) {
    return this.db.collection('workout-logs').add(data);
  }

  getAllWorkouts() {
    if (!this.challengeId) { return; }
    this.userWorkoutLogs = {};
    this.getInitData().then(() => {
      this.db.collection('workout-logs').valueChanges().subscribe((items) => {
        this.workoutLogs = items;
        let logs = _.filter(this.workoutLogs, (item) => {
          return (item.dateTime >= this.challenge.start.seconds * 1000 && item.dateTime <= this.challenge.end.seconds * 1000) &&
                  _.contains(this.challenge.participants, item.userId);
        });
        let workoutLogFormatted = _.map(logs, (item:any) => {
          return this.formatWorkoutLogItem(item);
        });
        this.users = _.map(this.challenge.participants, (id) => {
          return _.where(this.allUsers, {uid: id})[0];
        });
        _.each(this.users, (user) => {
          this.userWorkoutLogs[user.uid] = _.where(workoutLogFormatted, {userId: user.uid}).sort((a,b) => { return a.dateTime - b.dateTime; });
        });
        this.workoutsLoaded = true;
      })
    })
  }

  formatWorkoutLogItem(item) {
    let workout = _.where(this.workouts, {id: item.workoutId})[0];
    item.workoutName = workout.name;
    item.logTime = moment(item.dateTime).format('LLL');
    item.points = item.count * workout.multiplier;
    return item;
  }

  getMyTotalPoints(userId) {
    return _.reduce(_.pluck(this.userWorkoutLogs[userId], 'points'), function(memo, num){ return memo + num; }, 0);
  }

  getMyWorkoutPoints(userId) {
    let workoutsOnly = _.filter(this.userWorkoutLogs[userId], (item) => {
      return item.workoutId !== 3; //steps
    });
    return _.reduce(_.pluck(workoutsOnly, 'points'), function(memo, num){ return memo + num; }, 0);
  }

  getMyStepsPoints(userId) {
    let stepsOnly = _.filter(this.userWorkoutLogs[userId], (item) => {
      return item.workoutId === 3; //steps
    });
    return _.reduce(_.pluck(stepsOnly, 'count'), function(memo, num){ return memo + num; }, 0);
  }

  getLeaderBoardData(type) {
    let fn = this.getWorkoutFn(type).bind(this);
    let leaderBoard = [];
    _.each(this.users, (user) => {
      let item = {
        id: user.uid,
        name: user.displayName,
        points: fn(user.uid)
      };
      leaderBoard.push(item);
    });
    leaderBoard.sort(function (a, b) {
      return b.points - a.points;
    });
    return leaderBoard;
  }

  getWorkoutFn(type) {
    switch (type) {
      case 'workout':
        return this.getMyWorkoutPoints;
        break;
      case 'steps':
        return this.getMyStepsPoints;
        break;
      default:
        return this.getMyTotalPoints;
    }
  }

  getMyCombinedWorkouts(userId) {
    let workoutGroup = _.groupBy(this.userWorkoutLogs[userId], 'workoutName');
    let combinedWorkouts = [];
    _.each(workoutGroup, (group) => {
      var total = _.reduce(_.pluck(group, 'count'), (memo, num) => { return memo + num; });
      combinedWorkouts.push({ 'workoutName': [group[0].workoutName], 'count': total });
    })
    return combinedWorkouts;
  }

  clearWorkouts() {
    this.workoutLogs = [];
    this.userWorkoutLogs = {};
    this.challengeId = '';
    this.workoutsLoaded = false;
  }

  deleteLog(logItem) {
    const log = this.db.collection('workout-logs', ref => {
      return ref
        .where('userId', '==', logItem.userId)
        .where('dateTime', '==', logItem.dateTime)
        .where('workoutId', '==', logItem.workoutId);
    });
    let subscription = log.snapshotChanges().subscribe((res: any) => {
      let id = res[0] && res[0].payload.doc && res[0].payload.doc.id;
      this.db.collection('workout-logs').doc(id).delete();
      subscription.unsubscribe();
    });
  }

}
