import {Component, serialize, deserialize, isComponent, property} from '../../..';

describe('Component', () => {
  test('Creation', async () => {
    class Movie extends Component() {
      constructor() {
        super();
        this.title = '';
      }

      duration = undefined;
    }

    // Make sure there are no enumerable properties in the class
    expect(Object.keys(Movie)).toHaveLength(0);

    const movie = new Movie();

    expect(isComponent(movie)).toBe(true);
    expect(movie).toBeInstanceOf(Movie);

    expect(Object.keys(movie)).toHaveLength(2);
    expect(Object.keys(movie)).toContain('title');
    expect(Object.keys(movie)).toContain('duration');
    expect(movie.title).toBe('');
    expect(movie.duration).toBe(undefined);
  });

  test('Instantiation', async () => {
    class Movie extends Component() {
      constructor() {
        super();
        this.title = '';
      }

      duration = undefined;
    }

    const movie = Movie.instantiate();

    expect(isComponent(movie)).toBe(true);
    expect(movie).toBeInstanceOf(Movie);

    // Make sure the initializers have not be called
    expect(Object.keys(movie)).toHaveLength(0);
  });

  test('Checking that an object is a component', async () => {
    expect(isComponent(undefined)).toBe(false);
    expect(isComponent(null)).toBe(false);
    expect(isComponent(true)).toBe(false);
    expect(isComponent(1)).toBe(false);
    expect(isComponent({})).toBe(false);

    class Movie extends Component() {}

    expect(isComponent(Movie.prototype)).toBe(true);

    const movie = new Movie();

    expect(isComponent(movie)).toBe(true);
  });

  test('Naming', async () => {
    class Movie extends Component() {}

    expect(Movie.getName()).toBe('Movie');

    Movie.setName('Film');

    expect(Movie.getName()).toBe('Film');

    Movie.setName('MotionPicture');

    expect(Movie.getName()).toBe('MotionPicture');

    // Make sure there are no enumerable properties
    expect(Object.keys(Movie)).toHaveLength(0);

    expect(() => Movie.setName()).toThrow();
    expect(() => Movie.setName('')).toThrow();
    expect(() => Movie.setName(123)).toThrow();
    expect(() => Movie.setName('Component')).toThrow();

    const Anonymous = (() => class extends Component() {})();

    expect(() => Anonymous.getName()).toThrow("Component's name is missing");
    expect(Anonymous.getName({throwIfMissing: false})).toBeUndefined();
  });

  test('isNew mark', async () => {
    class Movie extends Component() {}

    const movie = new Movie();

    expect(movie.isNew()).toBe(true);

    movie.markAsNotNew();

    expect(movie.isNew()).toBe(false);

    movie.markAsNew();

    expect(movie.isNew()).toBe(true);
  });

  test('Forking', async () => {
    class Movie extends Component() {
      @property() static limit = 100;

      @property() title = '';
    }

    const ForkedMovie = Movie.fork();

    expect(ForkedMovie.limit).toBe(100);

    ForkedMovie.limit = 500;

    expect(ForkedMovie.limit).toBe(500);
    expect(Movie.limit).toBe(100);

    const movie = new Movie();

    const forkedMovie = movie.fork();

    expect(forkedMovie.title).toBe('');

    forkedMovie.title = 'Inception';

    expect(forkedMovie.title).toBe('Inception');
    expect(movie.title).toBe('');
  });

  test('Class serialization', async () => {
    class Movie extends Component() {}

    expect(serialize(Movie, {knownComponents: [Movie]})).toEqual({__Component: 'Movie'});

    class MovieWithLimit extends Movie {
      @property() static limit = 100;
    }

    expect(serialize(MovieWithLimit, {knownComponents: [MovieWithLimit]})).toEqual({
      __Component: 'MovieWithLimit',
      limit: 100
    });

    class Cinema extends Component() {
      @property() static MovieClass = MovieWithLimit;
    }

    expect(() => serialize(Cinema, {knownComponents: [Cinema]})).toThrow(
      "The 'MovieWithLimit' component is unknown"
    );

    expect(serialize(Cinema, {knownComponents: [Cinema, MovieWithLimit]})).toEqual({
      __Component: 'Cinema',
      MovieClass: {__Component: 'MovieWithLimit', limit: 100}
    });
  });

  test('Instance serialization', async () => {
    class Movie extends Component() {
      @property() title;
      @property() director;
    }

    const movie = new Movie();

    expect(serialize(movie, {knownComponents: [Movie]})).toEqual({
      __component: 'Movie',
      __new: true,
      title: {__undefined: true},
      director: {__undefined: true}
    });

    movie.markAsNotNew();

    expect(serialize(movie, {knownComponents: [Movie]})).toEqual({
      __component: 'Movie',
      title: {__undefined: true},
      director: {__undefined: true}
    });

    movie.title = 'Inception';

    expect(serialize(movie, {knownComponents: [Movie]})).toEqual({
      __component: 'Movie',
      title: 'Inception',
      director: {__undefined: true}
    });

    expect(
      serialize(movie, {
        knownComponents: [Movie],
        propertyFilter(property) {
          expect(this).toBe(movie);
          expect(property.getParent()).toBe(movie);
          return property.getName() === 'title';
        }
      })
    ).toEqual({
      __component: 'Movie',
      title: 'Inception'
    });

    expect(
      await serialize(movie, {
        knownComponents: [Movie],
        async propertyFilter(property) {
          expect(this).toBe(movie);
          expect(property.getParent()).toBe(movie);
          return property.getName() === 'title';
        }
      })
    ).toEqual({
      __component: 'Movie',
      title: 'Inception'
    });

    class Director extends Component() {
      @property() name;
    }

    movie.director = new Director();
    movie.director.name = 'Christopher Nolan';

    expect(serialize(movie, {knownComponents: [Movie, Director]})).toEqual({
      __component: 'Movie',
      title: 'Inception',
      director: {__component: 'Director', __new: true, name: 'Christopher Nolan'}
    });
  });

  test('Class deserialization', async () => {
    class Movie extends Component() {
      @property() static limit;
    }

    expect(Movie.limit).toBeUndefined();

    const DeserializedMovie = deserialize(
      {__Component: 'Movie', limit: 100},
      {knownComponents: [Movie]}
    );

    expect(DeserializedMovie).toBe(Movie);
    expect(Movie.limit).toBe(100);

    class Film extends Component() {}

    expect(() => deserialize({__Component: 'Movie'}, {knownComponents: [Film]})).toThrow(
      "The 'Movie' component is unknown"
    );
  });

  test('Instance deserialization', async () => {
    class Movie extends Component() {
      @property() title;
      @property() duration = 0;
    }

    const movie = deserialize(
      {__component: 'Movie', title: 'Inception'},
      {knownComponents: [Movie]}
    );

    expect(movie).toBeInstanceOf(Movie);
    expect(movie).not.toBe(Movie.prototype);
    expect(movie.isNew()).toBe(false);
    expect(Object.keys(movie)).toEqual(['title']);
    expect(movie.title).toBe('Inception');

    const movie2 = deserialize(
      {__component: 'Movie', __new: true, title: 'Inception'},
      {knownComponents: [Movie]}
    );

    expect(movie2).toBeInstanceOf(Movie);
    expect(movie2).not.toBe(Movie.prototype);
    expect(movie2.isNew()).toBe(true);
    expect(Object.keys(movie2)).toHaveLength(2);
    expect(Object.keys(movie2)).toContain('title');
    expect(Object.keys(movie2)).toContain('duration');
    expect(movie2.title).toBe('Inception');
    expect(movie2.duration).toBe(0);

    const movie3 = deserialize(
      {__component: 'Movie', __new: true, title: 'Inception', duration: 120},
      {knownComponents: [Movie]}
    );

    expect(movie3.title).toBe('Inception');
    expect(movie3.duration).toBe(120);

    const movie4 = deserialize(
      {__component: 'Movie', __new: true, title: 'Inception', duration: 120},
      {
        knownComponents: [Movie],
        propertyFilter(property) {
          expect(this).toBeInstanceOf(Movie);
          expect(property.getParent()).toBe(this);
          return property.getName() === 'title';
        }
      }
    );

    expect(movie4.title).toBe('Inception');
    expect(movie4.duration).toBe(0);

    const movie5 = await deserialize(
      {__component: 'Movie', __new: true, title: 'Inception', duration: 120},
      {
        knownComponents: [Movie],
        async propertyFilter(property) {
          expect(this).toBeInstanceOf(Movie);
          expect(property.getParent()).toBe(this);
          return property.getName() === 'title';
        }
      }
    );

    expect(movie5.title).toBe('Inception');
    expect(movie5.duration).toBe(0);

    const movie6 = Movie.fromJSON({__component: 'Movie', title: 'Inception'});

    expect(movie6).toBeInstanceOf(Movie);
    expect(Object.keys(movie6)).toEqual(['title']);
    expect(movie6.title).toBe('Inception');

    class Cinema extends Component() {
      @property() movies;
    }

    const cinema = deserialize(
      {__component: 'Cinema', movies: [{__component: 'Movie', title: 'The Matrix'}]},
      {knownComponents: [Cinema, Movie]}
    );

    expect(cinema).toBeInstanceOf(Cinema);
    expect(Object.keys(cinema)).toEqual(['movies']);
    expect(cinema.movies).toHaveLength(1);
    expect(cinema.movies[0]).toBeInstanceOf(Movie);
    expect(Object.keys(cinema.movies[0])).toEqual(['title']);
    expect(cinema.movies[0].title).toBe('The Matrix');
  });
});
